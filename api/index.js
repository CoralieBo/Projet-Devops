const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { default: axios } = require('axios');
const { exec } = require('child_process');
var cron = require('node-cron');
const app = express();

const port = 8888;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Bonjour, monde !');
});

async function downloadDockerImage(contener, imageName, lastUpdate, port, containerName) {
    try {
        console.log(`Vérification de la mise à jour de l'image ${imageName}`);
        const response = await axios.get(`https://hub.docker.com/v2/repositories/${imageName}/tags/`);
        const imageUpdate = response.data.results[0].last_updated;
        if (lastUpdate < imageUpdate || contener == null) {
            const tag = response.data.results[0].name;
            contener = await pullDockerImage(contener, imageName, tag, port, containerName);

            return [imageUpdate, contener];
        } else {
            console.log(`Pas de mise à jour de l'image ${imageName}`);
            return [lastUpdate, contener];
        }
    } catch (error) {
        console.log(error);
    }
}

function pullDockerImage(contener, image, tag, port, containerName) {
    return new Promise((resolve, reject) => {
        const command = `docker pull ${image}:${tag}`;
        const childProcess = exec(command);

        // childProcess.stdout.on('data', (data) => {
        //     console.log(data.toString());
        // });

        childProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        childProcess.on('exit', (code) => {
            if (code === 0) {
                console.log(`Image tirée avec succès: ${image}`);
                contener = runDockerContainer(contener, image, port, containerName);
                resolve(contener);
            } else {
                console.error(`Erreur lors du pull de l'image: ${image}`);
                reject();
            }
        });
    });

}

function runDockerContainer(contener, image, port, containerName) {
    return new Promise((resolve, reject) => {
        if (contener !== null) {
            stopDockerContainer(contener);
            deleteDockerContainer(contener);
        }
        const command = `docker run --network project --name ${containerName} -p ${port} -d ${image}`;
        const childProcess = exec(command);

        childProcess.stdout.on('data', (data) => {
            // console.log(data.toString());
            contener = data.toString();
        });

        childProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        childProcess.on('exit', (code) => {
            if (code === 0) {
                console.log(`Container lancé avec succès: ${containerName}`);
                resolve(contener);
            } else {
                console.error(`Erreur lors du lancement du container: ${containerName}`);
                reject();
            }
        });
    });
}

function stopDockerContainer(containerName) {
    return new Promise((resolve, reject) => {
        const stopCommand = `docker stop ${containerName}`;
        const childProcess = exec(stopCommand);

        // childProcess.stdout.on('data', (data) => {
        //     console.log(data.toString());
        // });

        childProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        childProcess.on('exit', (code) => {
            if (code === 0) {
                console.log(`Container arrêté avec succès: ${containerName}`);
                resolve();
            } else {
                console.error(`Erreur lors de l'arrêt du container: ${containerName}`);
                reject();
            }
        });
    });
}

function deleteDockerContainer(containerName) {
    return new Promise((resolve, reject) => {
        const deleteCommand = `docker rm ${containerName}`;
        const childProcess = exec(deleteCommand);

        // childProcess.stdout.on('data', (data) => {
        //     console.log(data.toString());
        // });

        childProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        childProcess.on('exit', (code) => {
            if (code === 0) {
                console.log(`Container supprimé avec succès: ${containerName}`);
                resolve();
            } else {
                console.error(`Erreur lors de la suppression du container: ${containerName}`);
                reject();
            }
        });
    });
}

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
    let lastUpdateBack = null;
    let lastUpdateFront = null;
    let backContener = null;
    let frontContener = null;
    const command = `docker network create project`;
    exec(command);
    cron.schedule('* * * * *', async() => {
        [lastUpdateBack, backContener] = await downloadDockerImage(backContener, "coralieboyer/back", lastUpdateBack, "3001:3001", "backend");
    });
    cron.schedule('* * * * *', async() => {
        [lastUpdateFront, frontContener] = await downloadDockerImage(frontContener, "coralieboyer/front", lastUpdateFront, "3000:3000", "frontend");
    });
});
