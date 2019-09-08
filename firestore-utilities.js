let dbutilities = (function() {
  const admin = require('firebase-admin');

  let serviceAccount = require('./serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  let fdb = admin.firestore();

  var rand = function() {
    return Math.random()
      .toString(36)
      .substr(2); // remove `0.`
  };

  var token = function() {
    return rand() + rand(); // to make it longer
  };

  function getCurrDate() {
    var today = new Date();
    var date =
      today.getFullYear() +
      '-' +
      (today.getMonth() + 1) +
      '-' +
      today.getDate();
    return date;
  }

  async function authUser(user, token) {
    const tokenRef = fdb
      .collection('sessions')
      .doc('active')
      .collection('tokens')
      .doc(token);

    try {
      let doc = await tokenRef.get();
      if (!doc.exists) return { status: 500, message: 'invalid token' };
      if (!doc.data.username == user)
        return { status: 500, message: 'token associated with another user' }; //wrong token for the user

      const userRef = fdb.collection('users').doc(user.toLowerCase());
      let userDoc = await userRef.get();

      if (!userDoc.exists) return { status: 500, message: 'no such user' }; //no such user
      if (!userDoc.data().verified)
        return {
          status: 500,
          message: 'you need to verify your account first'
        }; //user not verified

      return { status: 200, message: 'success!' };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function createNewUser(user, hashed_pw, phonenumber) {
    const userRef = fdb.collection('auth').doc(user.toLowerCase());

    try {
      let userDoc = await userRef.get();
      if (userDoc.exists) {
        return { status: 500, message: 'that username is taken' };
      }

      var date = getCurrDate();

      fdb
        .collection('auth')
        .doc(user.toLowerCase())
        .set({
          username: user,
          password: hashed_pw,
          date_created: date,
          last_login: date
        });

      var newToken = token();
      if (phonenumber) var phoneToken = rand();

      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .set({
          username: user,
          phone: phonenumber,
          token: newToken,
          phoneToken: phoneToken ? phoneToken : '',
          verified: false,
          phoneVerified: false,
          donations: [],
          spaces: []
        });

      return {
        status: 200,
        message:
          'Thank you for registering for Food Hunter. Please check your email (and phone if you put one in) to verify your account.',
        token: newToken,
        phoneToken: phoneToken
      };
    } catch (err) {
      console.log(err);
      return { status: 500, message: err.message };
    }
  }

  async function doLogin(user, password) {
    const userRef = fdb.collection('auth').doc(user.toLowerCase());
    try {
      let userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.log('invalid user');
        return { status: 500, message: 'invalid user' };
      }

      let data = userDoc.data();

      let correctpw = await require('./utils').verifyPassword(
        password,
        data.password
      );
      if (!correctpw) {
        console.log('incorrect pw');
        return { status: 500, message: 'password does not match' };
      }

      let newToken = token();
      fdb
        .collection('sessions')
        .doc('active')
        .collection('tokens')
        .doc(newToken)
        .set({ username: user });

      var date = getCurrDate();

      fdb
        .collection('auth')
        .doc(user.toLowerCase())
        .update({ last_login: date });
      console.log(newToken);
      return {
        status: 200,
        message: 'Successfully logged in! Welcome back to Food Hunter.',
        token: newToken
      };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function doLogout(user, token) {
    const tokenRef = fdb
      .collection('sessions')
      .doc('active')
      .collection('tokens')
      .doc(token);
    try {
      let doc = await tokenRef.get();
      if (!doc.exists) {
        console.log('no such token');
        return { status: 500, message: 'invalid token' };
      }
      if (!(doc.data().username === user)) {
        console.log('wrong username');
        return { status: 500, message: 'incorrect username' };
      } //can't logout on someone else's behalf
      var date = getCurrDate();
      fdb
        .collection('sessions')
        .doc('expired')
        .collection('tokens')
        .doc(token)
        .set({ username: user, expiry: date });

      tokenRef.delete();

      return {
        status: 200,
        message: 'Successfully logged out! See you next time.'
      };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function verifyUser(user, token) {
    const userRef = fdb.collection('users').doc(user.toLowerCase());
    try {
      let doc = await userRef.get();
      if (!(doc.data().token == token)) {
        console.log('bad token!');
        return { status: 500, message: 'Bad token' };
      }
      if (doc.data().verified == true) {
        console.log('already verified!');
        return { status: 500, message: 'Already Verified' };
      }
      userRef.update({ verified: true });
      return {
        status: 200,
        message: `${user} has successfully been verified. Thank you!`
      };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function verifyPhone(user, phone, token) {
    const userRef = fdb.collection('users').doc(user.toLowerCase());
    try {
      let doc = await userRef.get();
      if (!(doc.data().phoneToken == token)) {
        console.log('bad token!');
        return { status: 500, message: 'Bad token' };
      }
      if (doc.data().phoneVerified == true) {
        console.log('already verified!');
        return { status: 500, message: 'Already Verified' };
      }
      userRef.update({ phoneVerified: true });
      return {
        status: 200,
        message: `${phone} has successfully been verified. Thank you!`
      };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  //returns a snapshot of all users
  async function getAllUsers() {
    return await fdb.collection('users').get();
  }

  //returns a snapshot of all donations
  async function getAllDonations() {
    return await fdb.collection('donations').get();
  }

  //returns a snapshot of all spaces
  async function getAllSpaces() {
    return await fdb.collection('spaces').get();
  }

  async function pushDonation(user, token, donation) {
    auth = authUser(user, token);
    if (auth.status != 200) return auth;

    try {
      newRef = await fdb.collection('donations').add(donation);
      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .update({
          donations: admin.firestore.FieldValue.arrayUnion(newRef.id)
        });
      return { status: 200, message: 'success!' };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function pushSpace(user, token, space) {
    auth = authUser(user, token);
    if (auth.status != 200) return auth;
    try {
      newRef = await fdb.collection('spaces').add(space);
      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .update({
          spaces: admin.firestore.FieldValue.arrayUnion(newRef.id)
        });
      return true;
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function getUsersSpaces(user) {
    const userRef = fdb.collection('users').doc(user.toLowerCase());
    try {
      let userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.log('invalid user');
        return false;
      }

      return userDoc.data().spaces;
    } catch (err) {
      return false;
    }
  }

  async function getUsersDonations(user) {
    const userRef = fdb.collection('users').doc(user.toLowerCase());
    try {
      let userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.log('invalid user');
        return false;
      }

      return userDoc.data().donations;
    } catch (err) {
      return false;
    }
  }

  async function matchDonationToSpace(user, token, donation_id) {
    auth = authUser(user, token);
    if (auth.status != 200) return auth;

    const spaceCollection = fdb.collection('spaces');
    const donation = fdb.collection('donations').doc(donation_id);

    try {
      let snapshot = await spaceCollection.get();
      let donationDoc = await donation.get();
      if (snapshot.empty) {
        return { status: 200, message: 'No active events found at this time.' };
      }
      if (!donationDoc.exists) {
        return { status: 500, message: 'That donation id seems to be invalid' };
      }
      if (donation_doc.data().owner.toLowerCase() != user.toLowerCase()) {
        return {
          status: 500,
          message: "You don't have permission to edit that donation."
        };
      }

      let invalidEvents = donationDoc.data().rejectedEvents || [];

      let minDist = 1000000;
      let currSpaceId = 0;

      snapshot.forEach(doc => {
        if (!invalidEvents.includes(doc.id)) {
          //i.e. don't ask for rejected events
          let distance = Math.sqrt(
            Math.pow(donationDoc.latitude - spaceCollection.latitude, 2) +
              Math.pow(donationDoc.longitude - spaceCollection.longitude, 2)
          );
          if (distance < minDist) {
            currSpaceId = doc.id;
            minDist = dist;
          }
        }
      });

      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .update({
          invalid_users: admin.firestore.FieldValue.arrayUnion(currSpaceId)
        });
      return { status: 200, message: 'success!', donation: currSpaceId };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function assignDonationToSpace(user, token, donation_id, space_id) {
    auth = authUser(user, token);
    if (auth.status != 200) return auth;

    donationRef = fdb.collection('donations').doc(donation_id);
    spaceRef = fdb.collection('spaces').doc(space_id);

    try {
      let [donation_doc, space_doc] = await Promise.all(
        donationRef.get(),
        spaceRef.get()
      );
      if (!donation_doc.exists) {
        return { status: 500, message: 'No donation with that ID was found.' };
      }
      if (!space_doc.exists) {
        return { status: 500, message: 'No space with that ID was found.' };
      }
      if (donation_doc.data().owner.toLowerCase() != user.toLowerCase()) {
        return {
          status: 500,
          message: "You don't have permission to edit that donation."
        };
      }
      // donation_doc.update({"matched": space_id});
      fdb
        .collection('claimed_donations')
        .doc(donation_id)
        .set(donationRef.data());
      donationRef.delete();
      space_doc.update({
        matches: admin.firestore.FieldValue.arrayUnion(donation_id)
      });

      return { status: 200, message: 'success!' };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  async function getUserDataProfile(user) {
    userRef = fdb.collection('users').doc(user);
    try {
      let userDoc = await userRef.get();
      if (!userDoc.exists) return { status: 500, message: 'no such user' };
      return { status: 200, message: 'success', payload: userDoc.data() };
    } catch (err) {
      return { status: 500, message: err.message };
    }
  }

  return {
    db: fdb,
    addDonation: pushDonation, // TODO
    addSpace: pushSpace, // TODO
    assignDonation: assignDonationToSpace,
    checkAuth: authUser,
    createUser: createNewUser,
    getDonations: getAllDonations,
    getProfile: getUserDataProfile, // TODO
    getSpaces: getAllSpaces,
    getUsers: getAllUsers,
    getOneUsersSpaces: getUsersSpaces,
    getOneUsersDonations: getUsersDonations,
    login: doLogin,
    logout: doLogout,
    matchDonation: matchDonationToSpace,
    verify: verifyUser,
    verifyPhone: verifyPhone
  };
})();

exports.dbutilities = dbutilities;
