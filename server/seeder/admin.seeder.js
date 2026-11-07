require("dotenv").config({ path: "./../.env" })
const mongoose = require("mongoose")
const User = require("../models/User")
const bcrypt = require("bcryptjs")

exports.seedAdmin = async () => {
    try {

        // DB CONNECTED ✅
        await mongoose.connect(process.env.MONGO_URL)
        console.log("DB connected ✅")

        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        const mobile = process.env.ADMIN_MOBILE;
        const name = process.env.ADMIN_NAME;

        // ADMIN ALREADY EXIST CHECK 🚫 
        const result = await User.findOne({ email })
        if (result) {
            console.log("⚠️ Admin Already Exist 🚫 👑 ")
            process.exit(1)
        }

        // HASHING 🔐
        const hash = await bcrypt.hash(password, 10)

        await User.create({
            name,
            email,
            password: hash,
            mobile,
            department: "Management",
            role: "admin"
        })

        // ADMIN CREATED SUCCESSFULLY
        console.log("👑 Admin Created Successfully ✅ ")
        process.exit(0)
    } catch (error) {
        console.log("❌ Error", error);
        process.exit(1)
    }
}