# PathRise Job Board App

Minjae Park

## Task

- Given pipeline data of job opportunities, match each opportunity to known job boards.
- If job board cannot be identified, try identifying opportunity from a company website
- If neither job board nor company website can be identified, label as "Unknown"

## Approach

The `root_domain` property of the jobboard JSON file can help identify the job source as a job board.
A key-value pair of `root_domain` and `name` are put into a dictionary, since dictionary (hash map)
has a very low look up time, especially when keys are not numeric.

On each opportunity, a regular expression match will be used to extract the root domains in the `url` field.
This root domain can be looked up in the aforementioned dictionary to obtain the job board's `name`, which
can now be filtered in the query for each job board.

The functions `initJobBoard` and `initOpportunity` contains the logic the above approach in `initdb.js`.

## Extra things

## Dependencies

- `express`: URL handling and routing
  - `express-handlebars`: use handlebars template engine to render html templates
- `mongodb`: Connection to MongoDB database
- `csv-parser`: Parse csv entries into JSON objects
- `dot-env`: Environment variables in a file

## Dev Dependencies

- `nodemon`: automatically restart node when files are changed
- `jest`: unit testing environment

## Build

1. Clone repository
2. Ensure `node` and `npm` are installed, then run `npm install` to install dependencies
3. Run `npm run initdb` to initialize database. `initdb.js` has the functions for database logic
4. Run `npm run dev` to start application in dev mode or `npm start` to start application in production mode
5. Follow the link printed on console or go to [`http://localhost:3000`](http://localhost:3000) to see the application in action
