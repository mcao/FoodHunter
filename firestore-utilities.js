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
      if(!doc.exists) return {status: 500, message: "invalid token"}; 
      if(!doc.data.username == user)  return {status: 500, message: "token associated with another user"}; //wrong token for the user
      
      const userRef = fdb.collection('users').doc(user.toLowerCase()); 
      let userDoc = await userRef.get();
      
      if(!userDoc.exists) return {status: 500, message: "no such user"}; //no such user
      if(!userDoc.data().verified) return {status: 500, message: "you need to verify your account first"}; //user not verified

      return {status: 200, message: "success!"};
    } catch (err) {
      return {status: 500, message: err.message};
    }

  }

  async function createNewUser(user, hashed_pw) {
    const userRef = fdb.collection('auth').doc(user.toLowerCase());

    try {
      let userDoc = await userRef.get();
      console.log(userDoc);
      if (userDoc.exists) {
        return {status: 500, message: "that username is taken"};
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

      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .set({ 
          username: user, 
          token: newToken, 
          verified: false, 
          donations: [],
          spaces: [] 
        });

      return {status: 200, message: "success", token: newToken};
    } catch (err) {
      console.log(err);
      return {status: 500, message: err.message};
    }
  }

  async function doLogin(user, hashed_pw) {
    const userRef = fdb.collection('auth').doc(user.toLowerCase());
    try {
      let userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.log('invalid user');
        return {status: 500, message: "invalid user"};
      }
      let data = userDoc.data();
      if (data.password !== hashed_pw) {
        console.log('incorrect pw');
        return {status: 500, message: "password does not match"};
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
      return {status: 200, message: "success", token: newToken};
    } catch (err) {
      return {status: 500, message: err.message};
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
        return {status: 500, message: "invalid token"};
      }
      if (!(doc.data().username === user)) {
        console.log('wrong username');
        return {status: 500, message: "incorrect username"};
      } //can't logout on someone else's behalf
      var date = getCurrDate();
      fdb
        .collection('sessions')
        .doc('expired')
        .collection('tokens')
        .doc(token)
        .set({ username: user, expiry: date });

      tokenRef.delete();

      return {status: 200, message: "success!"};
    } catch (err) {
      return {status: 500, message: err.message};
    }
  }

  async function verifyUser(user, token) {
    const userRef = fdb.collection('users').doc(user.toLowerCase());
    try {
      let doc = await userRef.get();
      if (!(doc.data().token == token)) {
        console.log('bad token!');
        return {status: 500, message: "Bad token"};
      }
      if (doc.data().verified == true) {
        console.log('already verified!');
        return {status: 500, message: "Already Verified"};
      }
      userRef.update({ verified: true });
      return {status: 200, message: "Success!"};

    } catch (err) {
      return {status: 500, message: err.message};
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
    if(auth.status != 200) return auth;

    try {
      newRef = await fdb.collection('donations').add(donation);
      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .update({
           donations: admin.firestore.FieldValue.arrayUnion(newRef.id)
        });
      return {status: 200, message: "success!"};
    } catch (err) {
      return {status: 500, message: err.message};
    }
  }

  async function pushSpace(user, token, space) {
    auth = authUser(user, token);
    if(auth.status != 200) return auth;
    try {
      newRef = await fdb.collection('spaces').add(donation);
      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .update({
           spaces: admin.firestore.FieldValue.arrayUnion(newRef.id)
        });
      return true;
    } catch (err) {
      return {status: 500, message: err.message};
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
    } catch(err) {
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
    } catch(err) {
      return false;
    }
  } 

  return {
    db: fdb,
    addDonation: pushDonation,
    addSpace: pushSpace,
    checkAuth: authUser,
    createUser: createNewUser, //implemented
    getDonations: getAllDonations,
    getSpaces: getAllSpaces,
    getUsers: getAllUsers,
    getOneUsersSpaces: getUsersSpaces,
    getOneUsersDonations: getUsersDonations,
    login: doLogin,
    logout: doLogout,
    verify: verifyUser //implemented
  };
})();

exports.dbutilities = dbutilities;
