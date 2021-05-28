# Sieberrsec CTF Platform
Sieberrsec CTF platform. A Jeopardy CTF platform designed with various neat features to aid in training and learning. Written in ReactJS and NodeJS

The platform is still currently in **early alpha** and in **active development**. There is unfortunately no easy way to deploy the platform at the moment, but we welcome any contributions to change this :smile:.

You can find a working copy of the platform [here](https://ctfx.irscybersec.tk) used by our club, but we are unfortunately unable to provide a demo account.

Feel free to take a look at the screenshots below for a peek at what the platform can do!

## Features

- "**Categories**" for better organization of challenges into different "events"
- **Sorting of challenges** by their tags
- **Announcements** with markdown support
- **Markdown supported Challenge Descriptions** that allow you to add **code blocks with syntax highlighting, math** and more
- **Writeup links** per challenge (along with the option to only release writeups after submitting the flag)
- **Challenge Creator Role** so as to allow challenge authors to submit challenges without having full admin access
- Links to each challenge so that individual challenges can be shared
- Easy management of challenges and users
  - Disable registration, change permissions etc.
- Juicy React-Spring transitions

## Rough Usage Guide
- Clone the `/client` and `/api` directories to the places where you want to host the client and API. You can use something like `nginx` to host and serve the files

### Client
- Run `npm i` inside `/client` to install the dependencies
- Modify `window.ipAddress` inside `/client/src/app.js` to wherever your API is hosted at
- Make any other modifications you want in `src` and then `npm run build` to compile the client. 
- The resulting client files will be located in `/client/build`. Copy them into a place where you can serve them to the web.
### Server
- Install MongoDB by following [this](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-18-04)
- Run `npm i` inside `/api` to install the dependencies
- Use `pm2` or anything else to run `api.js` in the background (E.g `pm2 start api.js`)

## Screenshots

![image](1.jpg)

*Challenges page. Includes "Categories" to better sort challenges into various events and more*

![](5.jpg)

*In each category, challenges are automatically sorted according to the tags assigned to each challenge by default. You can also all the challenges in a category by switching to "Sort by Category" mode and sort them using various sort options such as in Ascending Amount of Points*

![](6.jpg)

*Modal for a challenge*

![](2.jpg)

*Scoreboard of the platform*

![](3.jpg)

*Admin panel showing the list of challenges. Here you can create, edit and delete challenges.*

![](4.jpg)

*Create a new challenge page*

![](7.jpg)

*Profile page of a user*

![](8.jpg)

*Home page with announcements*

![](9.jpg)

*Challenge creation page for challenge authors without access to the admin panel*
