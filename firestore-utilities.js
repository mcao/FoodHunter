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

  async function createNewUser(user, hashed_pw) {
    const userRef = fdb.collection('auth').doc(user.toLowerCase());

    try {
      let userDoc = await userRef.get();
      console.log(userDoc);
      if (userDoc.exists) {
        return false;
      }
      var today = new Date();
      var date =
        today.getFullYear() +
        '-' +
        (today.getMonth() + 1) +
        '-' +
        today.getDate();
   
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
    const userRef = fdb.collection('auth').doc(user.ToLowerCase());
    try {
      let userDoc = await userRef.get();
      if (!userDoc.exists) {
        return false;
      }
      let data = userDoc.data();
      if (data.password !== hashed_pw) {
        return false;
      }

      let newToken = token();
      fdb
        .collection('sessions')
        .doc('active')
        .collection('tokens')
        .doc(newToken)
        .set({ username: user });

      var today = new Date();
      var date =
        today.getFullYear() +
        '-' +
        (today.getMonth() + 1) +
        '-' +
        today.getDate();
      
        fdb
          .collection("auth")
          .doc(user.toLowerCase())
          .update({last_login: date});
      return newToken;
    } catch (err) {
      return false;
    }
  }

  return {
    db: fdb,
    createUser: createNewUser,
    login: doLogin
  };
})();

exports.dbutilities = dbutilities;
