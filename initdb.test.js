"use strict"

// import modules
const initdbfunc = require("./initdb");

describe("Identifying Job Sources", () => {
  var job_boards;
  var domains;
  // setup
  beforeAll(async () => {
    // set up domains dictionary
    job_boards = await initdbfunc.readJSON("./raw/jobBoards.json");
    domains = initdbfunc.mapDomains(job_boards);
  })

  // test with sample_job_source_resolution_data.csv
  test("Sample resolution should match with findSource output", async () => {
    let orig_data = await initdbfunc.readCSV("./raw/sample_job_source_resolution_data.csv");
    let new_data = initdbfunc.findSource(domains, orig_data);

    for (let i = 0; i < orig_data.length; i++) {
      expect(new_data[i].source).toBe(orig_data[i]["Job Source"]);
    }
  });

  // test with unknown sources
  test("Job opportunities without a job url should be identified as unknown", ()=>{
    let ops = [
      {
        company: "",
        url: ""
      },
      {
        company: "blahblah",
        url: " "
      }
    ];
    let new_ops = initdbfunc.findSource(domains, ops);

    for (let i = 0; i < ops.length; i++) {
      expect(new_ops[i].source).toBe("Unknown");
    }
  });

  // test with company websites
  test("Job opportunities that contain the company name in the base url should be identified as 'Company Website'", ()=>{
    let ops = [
      {
        company: "Pathrise",
        url: "https://www.pathrise.com/careers"
      },
      {
        company: "ToyStory",
        url: "toystory.com/movies/"
      }
    ];
    let new_ops = initdbfunc.findSource(domains, ops);

    for (let i = 0; i < ops.length; i++) {
      expect(new_ops[i].source).toBe("Company Website");
    }
  });
})