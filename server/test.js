require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const query = { 
            $or: [
                { approvalStatus: "Pending" },
                { approvalStatus: "pending" },
                { status: "Pending Approval" },
                { status: "pending" }
            ] 
        };
        const records = await Attendance.find(query)
            .populate("employeeId", "name email department profilePic")
            .sort({ date: -1, createdAt: -1 })
            .skip(0)
            .limit(10)
            .lean();
        
        console.log("Success!", records.length);
        const formattedRecords = records.map(record => ({
            ...record,
            employee: record.employeeId || { name: "Deleted Employee", department: "N/A", profilePic: "" },
            employeeId: record.employeeId?._id || record.employeeId || null
        }));
        console.log("Formatted!", formattedRecords.length);
    } catch (e) {
        console.error("ERROR:", e.message, e.stack);
    } finally {
        mongoose.disconnect();
    }
}
test();
