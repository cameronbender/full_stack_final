const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000/api/proposals';

const proposals = [
    {
        title: 'Purity of Biochar Created in an Innovative Kiln',
        author_name: 'Rowan Norrad',
        institution: 'Acadia University',
        supervisor: 'Ashley Doyle',
        filename: 'Purity of Biochar Created in an Innovative Kiln.pdf'
    },
    {
        title: 'Biochar’s Impact on Eco-Anxiety and Empowerment',
        author_name: 'Brenna Cowan',
        institution: 'Acadia University',
        supervisor: 'Ashley Doyle',
        filename: 'Biochar’s Impact on Eco-Anxiety and Empowerment.pdf'
    },
    {
        title: 'Economic Impact of Biochar in Local Agriculture',
        author_name: 'Emma Pope',
        institution: 'Acadia University',
        supervisor: 'Kristen Williams',
        filename: 'Economic Impact of Biochar in Local Agriculture.pdf'
    }
];

async function seed() {
    console.log('Starting seed process...');

    for (const proposal of proposals) {
        const filePath = path.join(__dirname, proposal.filename);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${proposal.filename}`);
            continue;
        }

        const form = new FormData();
        form.append('title', proposal.title);
        form.append('author_name', proposal.author_name);
        form.append('institution', proposal.institution);
        form.append('supervisor', proposal.supervisor);
        form.append('pdf', fs.createReadStream(filePath));

        try {
            const response = await axios.post(API_URL, form, {
                headers: {
                    ...form.getHeaders()
                }
            });
            console.log(`Successfully uploaded: ${proposal.title}`);
        } catch (error) {
            console.error(`Failed to upload ${proposal.title}:`, error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }
    }

    console.log('Seed process completed.');
}

seed();
