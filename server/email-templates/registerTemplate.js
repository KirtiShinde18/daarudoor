const { baseTemplate } = require("./baseTemplate")

exports.registerTemplate = ({ name, password }) => {
    const content = `
        <h2>Welcome to BLOOMATRIX INFOTECH</h2>
        <p> Hi,${name} </p>
        <div> Your Password is 🔐 <h1>${password}</h1> </div>
        <p> Thank you for choosing BLOOMATRIX INFOTECH. </p>
    `
    return baseTemplate({
        title: "Welcome to BLOOMATRIX INFOTECH",
        content
    })
}
