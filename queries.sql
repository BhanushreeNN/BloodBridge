CREATE TABLE users(
username VARCHAR(30) PRIMARY KEY,
password VARCHAR(100)
);

CREATE TABLE donor 
(donor_id SERIAL PRIMARY KEY,
username VARCHAR(30),
first_name VARCHAR(20),
last_name VARCHAR(20),
dob DATE,
gender VARCHAR(6),
blood_grp VARCHAR(3),
email VARCHAR(30),
ph_no VARCHAR(15),
states VARCHAR(20),
district VARCHAR(20),
address VARCHAR(50),
 FOREIGN KEY(username) REFERENCES users(username)
);

CREATE TABLE requests 
(request_id SERIAL PRIMARY KEY,
 username VARCHAR(30) ,
first_name VARCHAR(20),
last_name VARCHAR(20),
 dob DATE,
 gender VARCHAR(6),
 blood_grp VARCHAR(3),
 email VARCHAR(30),
 ph_no VARCHAR(15),
 units INT,
 reason VARCHAR(100),
 states VARCHAR(20),
 district VARCHAR(20),
 address VARCHAR(50),
 FOREIGN KEY(username) REFERENCES users(username)
);


CREATE TABLE donation_history
(donation_id SERIAL PRIMARY KEY,
 request_id INT,
 donor_id INT,
 status VARCHAR(20),
 date_updated DATE,
 time_updated TIME,
 FOREIGN KEY(request_id) REFERENCES requests(request_id),
 FOREIGN KEY(donor_id) REFERENCES donor(donor_id)
);