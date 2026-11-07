const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const { markAttendance } = require("./controllers/employee.controller");

async function test() {
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/bloomatrix");
    console.log("Connected to MongoDB");

    const User = require("./models/User");
    const user = await User.findOne({ role: "employee" });
    
    if (!user) {
        console.log("No user found");
        process.exit(1);
    }

    const req = {
        user: user._id.toString(),
        body: {
            attendanceType: "Check In",
            latitude: undefined,
            longitude: undefined,
            accuracy: undefined,
            address: undefined,
            deviceTime: new Date().toISOString(),
            timezone: "Asia/Kolkata"
        }
    };

    const Attendance = require("./models/Attendance");
    const today = new Date().toISOString().split("T")[0];
    await Attendance.deleteOne({ employeeId: user._id, date: today });

    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log(`Response [${this.statusCode}]:`, data);
        }
    };

    console.log("Calling markAttendance...");
    await markAttendance(req, res);
    
    // Also test getAttendancePolicy
    console.log("Calling getAttendancePolicy...");
    const { getAttendancePolicy } = require("./controllers/employee.controller");
    await getAttendancePolicy(req, res);

    process.exit(0);
}

test().catch(err => {
    console.error("Uncaught Error:", err);
    process.exit(1);
});
