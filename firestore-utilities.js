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
    const tokenRef =  
    fdb
     .collection('sessions')
     .doc('active')
     .collection('tokens')
     .doc(token);

     try {
       let doc = await tokenRef.get();
       return (doc.data.username == user);
     } catch (err) {
       return false;
     }
  }

  async function createNewUser(user, hashed_pw) {
    const userRef = fdb.collection('auth').doc(user.toLowerCase());

    try {
      let userDoc = await userRef.get();
      console.log(userDoc);
      if (userDoc.exists) {
        return false;
      }

      var date = getCurrDate();
   
      fdb.collection('auth').doc(user.toLowerCase()).set({
        username: user,
        password: hashed_pw,
        date_created: date,
        last_login: date
      });

      var newToken = token();

      fdb
        .collection('users')
        .doc(user.toLowerCase())
        .set({ username: user, token: newToken, verified: false });
     
      return newToken;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async function doLogin(user, hashed_pw) {
    const userRef = fdb.collection('auth').doc(user.toLowerCase());
    try {
      let userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.log("invalid user");
        return false;
      }
      let data = userDoc.data();
      if (data.password !== hashed_pw) {
        console.log("incorrect pw");
        return false;
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
          .collection("auth")
          .doc(user.toLowerCase())
          .update({last_login: date});
      console.log(newToken);
      return newToken;
    } catch (err) {
      return false;
    }
  }

  async function doLogout(user, token) {
    const tokenRef = 
      fdb
        .collection('sessions')
        .doc('active')
        .collection('tokens')
        .doc(token);
      try {
        let doc = await tokenRef.get();
        if(!doc.exists) {console.log("no such token"); return false;}
        if(!(doc.data().username === user)) {console.log("wrong username"); return false;} //can't logout on someone else's behalf
        var date = getCurrDate();
        fdb
          .collection('sessions')
          .doc('expired')
          .collection('tokens')
          .doc(token).set({username: user, expiry: date});
        
          tokenRef.delete();

          return true;
      } catch (err) {
          return false;
      }
  }

  async function verifyUser(user, token) {
    const userRef = fdb.collection('users').doc(user.toLowerCase());
    try {
      let doc = await userRef.get();
      if(!(doc.data().token == token)) { console.log("bad token!"); return false; }
      if(doc.data().verified == true) { console.log("already verified!");  return false; }
      userRef.update({verified: true});
      return true;
      
    } catch(err) {
      return false;
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

  return {
    db: fdb,
    checkAuth: authUser,
    createUser: createNewUser,
    getDonations: getAllDonations,
    getSpaces: getAllSpaces,
    getUsers: getAllUsers,
    login: doLogin,
    logout: doLogout,
    verify: verifyUser
  };
})();

exports.dbutilities = dbutilities;