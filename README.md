# PathRise Job Board App

Minjae Park

## Task

- Given pipeline data of job opportunities, match each opportunity to known job boards.
- If job board cannot be identified, try identifying opportunity from a company website
- If neither job board nor company website can be identified, label as "Unknown"

## Dependencies

- `express`: URL handling and routing
  - `express-handlebars`: use handlebars template engine to render html templates
- `mongodb`: Connection to MongoDB database
- `csv-parser`: Parse csv entries into JSON objects / write JSON objects into csv files
- `dot-env`: Environment variables
- `cross-env`: Use environment variables across platforms

## Build

1. Clone repository
2. Ensure `node` and `npm` are installed, then run `npm install` to install dependencies
3. Run `npm run initdb` to initialize database. `initdb.js` has the functions for database logic
4. Run `npm run dev` to start application in dev mode or `npm start` to start application in production mode
5. Follow the link printed on console or go to [`http://localhost:3000`](http://localhost:3000) to see the application in action
