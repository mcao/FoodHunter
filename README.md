![image](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_thumbnail_photos/000/834/997/datas/medium.png)

# PennApps XX: Food Hunter
#### An app that allows people who need food to find it. Created at PennApps XX by Michael Cao, Elizabeth Cao, Vishwa Shanmugam, and Naveen Raman.

## Branches
### Backend
The Backend branch contains code for a Node.js Express server that serves as the backend API of the application. It performs functions such as data retrieval, data storage, registration/login/logout, and various useful functions with users, donations, and storage locations. Using Firebase as its storage backend, it relies on a set of web server routes to perform the bulk of its functionality, and has much room for improvement. Database interaction functions and web server routes are handled separately, in order to better modularize the API and allow for more efficient and effective pair/partner programming. As this was developed by two people simultaneously, the need for said modularization is critical to ensure productivity on the part of both developers.

#### TODO: 
- Create an algorithm to recommend food and locations to people who need food, and who need places to store excess food.
- Make use of the Firebase login flow to make login entirely based on Firebase and allow users to login with third party services including Google, Facebook, Twitter, etc.
- More secure storage of sensitive user data, including a databases of locations, food items, people, and more. 
- Improve email and phone verification, especially phone verification through Twilio as that has been problematic.
- Improve handling of database related functions, as they are all bunched together into a singular function as of present.

### Frontend
The Frontend branch contains code for a React Native application that acts as a wrapper around the backend API and web server routes. Intended to act as a user friendly way to interact with the backend, the total separation of backend and frontend ensures that other developers in the future will be able to make things such as a website, a computer based app, and applications for any number of different platforms that will have the same functionality as this fairly basic React Native application. Facilitating registration, login/logout, submission of data, and connection of different data points, this React Native based frontend application makes use of every single functionality of the backend application to act as the best possible partner to the backend application. Because React Native is able to be compiled into both iOS and Android applications, this application also functions as an easy way to publish a wrapper application onto both popular mobile operating systems.


#### TODO:
- Improve user interface and flow with more knowledge of React Native.
- More closely integrate functionalities of front and back end.
