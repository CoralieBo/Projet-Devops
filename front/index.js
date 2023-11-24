const { default: axios } = require("axios");

async function main() {
    try {
        const endpoint = "http://backcontainer:3001";
        const response = await axios.get(endpoint);
        console.log(response.data);
    } catch (error) {
        console.error(error);
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
}

main();