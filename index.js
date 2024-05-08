import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";

const app = express();
const port = 3001;
const saltRounds = 10;
let email, password;
env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.get("/", (req, res) => {
  res.render("BloodBridge.ejs");
});

app.get("/home", (req, res) => {
  res.render("index.ejs");
});

app.get("/about", (req, res) => {
  res.render("AboutUs.ejs");
});

app.get("/donate", async (req, res) => {
  const users = await db.query(
    "SELECT donor_id FROM donor WHERE username = $1;",
    [email]
  );
  // console.log(users.rows);
  if (users.rows.length > 0) {
    let head;
    const donorgrp_res = await db.query(
      "SELECT blood_grp FROM donor WHERE username = $1;",
      [email]
    );
    const donorgrp = donorgrp_res.rows[0].blood_grp;
    // console.log(donorgrp);
  
    let bloodreq;
    switch (donorgrp) {
      case "AB+":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      case "A+":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('A+', 'AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      case "A-":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('A-', 'A+', 'AB-', 'AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      case "B+":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('B+', 'AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      case "B-":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('B-', 'B+', 'AB-', 'AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      case "AB-":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('AB-', 'AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      case "O+":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('O+', 'A+', 'B+', 'AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      case "O-":
        bloodreq = await db.query(
          "SELECT request_id, first_name, last_name, email, ph_no, units, reason, states, district, address FROM requests WHERE blood_grp IN ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+') AND request_id NOT IN (SELECT request_id FROM donation_history WHERE status = 'donated');"
        );
        break;
      default:
        bloodreq = { rows: [] };
        break;
    }

    // console.log(bloodreq.rows);
    if (bloodreq.rows.length > 0) {
      head = "PEOPLE YOU CAN DONATE";
    } else {
      head = "NO REQUESTS AT THE MOMENT...";
    }

    res.render("RequestList.ejs", {
      heading: head,
      request_arr: bloodreq.rows,
    });
  } else {
    res.render("DonateReg.ejs");
  }
});

app.post("/selectRequest", async (req, res) => {
  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let currentDate = `${day}-${month}-${year}`;
  // console.log(currentDate);
  var current_time =
    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  // console.log(current_time);
  const donorIdResult = await db.query(
    "SELECT donor_id FROM donor WHERE username = $1;",
    [email]
  );
  const donorId = donorIdResult.rows[0].donor_id;
  const requestId = req.body.requestId;
  const donationResult = await db.query(
    "INSERT INTO donation_history (request_id, donor_id, status, date_updated,time_updated) VALUES ($1, $2, $3, CURRENT_DATE , $4)",
    [requestId, donorId, "pending", current_time]
  );
  res.redirect("/profile");
});

app.get("/request", (req, res) => {
  res.render("Request.ejs");
});

app.get("/profile", async (req, res) => {

  try {
    const donorInfo = await db.query(
      "SELECT * FROM donor WHERE username = $1",
      [email]
    );

    const donationHistory = await db.query(
      "SELECT dh.*, r.first_name, r.last_name, r.blood_grp, dh.date_updated, dh.time_updated FROM donation_history dh JOIN requests r ON dh.request_id = r.request_id WHERE dh.donor_id = $1",
      [donorInfo.rows[0].donor_id]
    );

    const allocrequestList = await db.query(
      "SELECT R.* , H.status FROM requests R, donation_history H WHERE R.request_id = H.request_id AND username = $1",
      [email]
    );

    const requestList = await db.query(
      "SELECT * FROM requests LEFT JOIN donation_history ON requests.request_id = donation_history.request_id WHERE donation_history.request_id IS NULL AND requests.username = $1;",
      [email]
    );

    res.render("Profile.ejs", {
      username: email,
      donorInfo: donorInfo.rows[0],
      donationHistory: donationHistory.rows,
      allocrequestList: allocrequestList.rows,
      requestList: requestList.rows,
      
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    // res.render("Error.ejs", { error: "Error fetching profile data" });
    res.send("Error fetching profile data (REGISTER AS A DONOR TO VIEW PROFILE)...");
  }
});

app.post("/confirmDonation", async (req, res) => {
  const request_id = req.body.requestId;
  console.log(req.body);
  try {
    await db.query(
      "UPDATE donation_history SET status = 'donated' WHERE request_id = $1",
      [request_id]
    );
    res.redirect("/profile");
  } catch (error) {
    // console.error("Error updating donation status:", error);
    // res.status(500).send("Error updating donation status");
    res.send("Error fetching profile data...");
  }
});

app.get("/logout", (req, res) => {
  res.render("BloodBridge.ejs");
});

app.post("/register", async (req, res) => {
  email = req.body.email;
  password = req.body.pswd;

  try {
    const checkResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [email]
    );

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      bcrypt.hash(password, saltRounds, async function (err, hash) {
        if (err) {
          console.log("Error hashing..", err);
        }
        const result = await db.query(
          "INSERT INTO users (username, password) VALUES ($1, $2)",
          [email, hash]
        );
        // console.log(result);
        res.render("index.ejs");
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  email = req.body.email;
  password = req.body.pswd;

  try {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;
      bcrypt.compare(password, storedPassword, function (err, result) {
        if (err) {
          console.log("Error hashing..", err);
        } else {
          if (result == true) {
            res.render("index.ejs");
          } else {
            res.send("Incorrect Password");
          }
        }
      });
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/regdonor", async (req, res) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const bloodgrp = req.body.bloodgrp;
  const emaildonor = req.body.email;
  const mobile = req.body.mobile;
  const state = req.body.state;
  const district = req.body.district;
  const address = req.body.address;
  // console.log(req.body);
  // console.log(email);
  // console.log(password);
  const result = await db.query(
    "INSERT INTO donor (username, first_name, last_name, dob, gender, blood_grp, email, ph_no, states, district, address ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
    [
      email,
      fname,
      lname,
      dob,
      gender,
      bloodgrp,
      emaildonor,
      mobile,
      state,
      district,
      address,
    ]
  );
  res.redirect("/donate");
});

app.post("/regrequest", async (req, res) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const dob = req.body.dob;
  const gender = req.body.gender;
  const bloodgrp = req.body.bloodgrp;
  const emailreq = req.body.email;
  const mobile = req.body.mobile;
  const units = req.body.units;
  const reason = req.body.reason;
  const state = req.body.state;
  const district = req.body.district;
  const address = req.body.address;
  // console.log(req.body);
  const result = await db.query(
    "INSERT INTO requests (username, first_name, last_name, dob, gender, blood_grp, email, ph_no, units, reason, states, district, address ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)",
    [
      email,
      fname,
      lname,
      dob,
      gender,
      bloodgrp,
      emailreq,
      mobile,
      units,
      reason,
      state,
      district,
      address,
    ]
  );
  res.redirect("/profile");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
