
///GETS
let zData = { "scope": ["ZohoCreator.report.READ"], "expiry_time": 1753483595135, "client_id": "1000.B5TUTGBYJ4WNFH86AV5O66CYATUVHB", "client_secret": "b1375a49aecea05933e4cc7f340ea47a4647ad3842", "code": "1000.4f56b5a4648808d0ec41c709c4681412.314f374933c0617074a831c30b395e59", "grant_type": "authorization_code" };

let accessToken = "1000.0f65d08d107f9a53436440715bd12d23.cd8e2a052b05bc388eb8ddccd9bb3c8c";
let tokenExpiresAt = 0;

async function refreshAccessToken() {
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: zData.client_id,
        client_secret: zData.client_secret,
        refresh_token: "1000.09770c77b7036937e304c6b2ac97b989.e3e077fcd2c57c67ab20516e4b74abda"
    });
    const res = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });
    if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);

    const { access_token, expires_in } = await res.json();
    accessToken = access_token;
    tokenExpiresAt = Date.now() + expires_in * 1000;
}


async function ensureToken() {
    // if no token yet, or expiring in <30s, refresh
    if (!accessToken || Date.now() > tokenExpiresAt - 30_000) {
        await refreshAccessToken();
    }
    return accessToken;
}


rt.post('/getzToken', urlParser, async (req, res) => {



    async function getZohoToken() {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',   // or 'client_credentials'
            client_id: zData.client_id,
            client_secret: zData.client_secret,
            //redirect_uri:  process.env.REDIRECT_URI, // only for auth_code flow
            code: zData.code,    // only for auth_code flow
            scope: zData.scope // only for client_credentials flow
        });

        const resp = await fetch('https://accounts.zoho.com/oauth/v2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!resp.ok) throw new Error(`Token request failed: ${await resp.text()}`);
        const json = await resp.json();
        const { access_token, refresh_token, expires_in } = json;
        console.log('Access Token:', access_token);
        console.log(json);
        res.send(json);
        //return somethin

        if (refresh_token) console.log('Refresh Token:', refresh_token);
        console.log('Expires In (s):', expires_in);
    }

    getZohoToken().catch(console.error);



});



rt.get('/zoho', urlParser, async (req, res, next) => {
    try {
        // 1️⃣ ensure we have a valid token
        const token = await ensureToken();

        // 2️⃣ pull any filters/pagination from the incoming URL
        const { page = '1', page_size = '200', criteria = '' } = req.query;
        const qs = new URLSearchParams({ page, page_size });
        if (criteria) qs.append('criteria', criteria);

        // 3️⃣ build your Zoho URL from env + query



        const accessToken = "1000.0f65d08d107f9a53436440715bd12d23.cd8e2a052b05bc388eb8ddccd9bb3c8c";
        const appLinkName = 'ftc-app';
        const reportLinkName = 'Membros_departamento_Report';
        const accountOwnerName = 'ftcmoz'; // Typically your Zoho username (e.g., "johnsmith")


        //  const url = `https://zohoapis.com/creator/v2/data/ftcmoz/ftc-app/report/Membros_departamento_Report`;

        const url = `https://creator.zoho.com/api/v2/${accountOwnerName}/${appLinkName}/report/${reportLinkName}`;


        // 4️⃣ fetch from Zoho
        let response = await fetch(url, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 5️⃣ on a 401, retry once
        if (response.status === 401) {
            const newToken = await ensureToken();
            response = await fetch(url, {
                headers: { 'Authorization': `Zoho-oauthtoken ${newToken}` }
            });
        }

        // 6️⃣ handle errors or return JSON
        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).send(errText);
        }
        const data = await response.json();
        res.json(data);

    } catch (err) {
        next(err);
    }
});

rt.get('/ggzoho', urlParser, async (req, res) => {




    async function fetchZohoReport() {


        const accessToken = 'YOUR_ACCESS_TOKEN';
        const appLinkName = 'ftc-app';
        const reportLinkName = 'Membros_departamento_Report';
        const accountOwnerName = 'ftcmoz'; // Typically your Zoho username (e.g., "johnsmith")


        //  const url = `https://zohoapis.com/creator/v2/data/ftcmoz/ftc-app/report/Membros_departamento_Report`;

        const url = `https://creator.zoho.com/api/v2/${accountOwnerName}/${appLinkName}/report/${reportLinkName}`;


        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Zoho Report Data:', data);
        } catch (err) {
            console.error('Error fetching Zoho report:', err.message);
        }
    }
    fetchZohoReport();

});

