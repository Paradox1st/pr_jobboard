# PathRise Job Board App

Minjae Park

## Task

- Given pipeline data of job opportunities, match each opportunity to known job boards.
- If job board cannot be identified, try identifying opportunity from a company website
- If neither job board nor company website can be identified, label as "Unknown"

## Dependencies

- Express: URL handling and routing
- mongodb: connection to MongoDB database
- csvtojson: parse csv entries into json objects
- Body-Parser: parse http requests only urls
- dot-env: environment variables
- cross-env: use environment variables across platforms

## Build

1. Clone repository
2. Ensure `node` and `npm` are installed, then run `npm install` to install dependencies
3. run `npm run dev` to start application in dev mode or `npm start` to start application in productionmode
4. Follow the link printed on console or go to [`http://localhost:3000`](http://localhost:3000) to see the application in action
