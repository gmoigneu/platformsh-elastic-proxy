const express = require('express');
const proxy = require('http-proxy-middleware');
const btoa = require('btoa');
const app = express();
const bodyParser = require('body-parser')
const config = require('platformsh-config').config();
const elastic = config.credentials('elasticsearch');
const cors = require('cors')

/* This is where we specify options for the http-proxy-middleware
 * We set the target to appbase.io backend here. You can also
 * add your own backend url here */
const options = {
    target: elastic.scheme+'://'+elastic.host+':'+elastic.port+'/',
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
        /*proxyReq.setHeader(
            'Authorization',
            `Basic ${btoa('cf7QByt5e:d2d60548-82a9-43cc-8b40-93cbbe75c34c')}`
        );*/
        /* transform the req body back from text */
        const { body } = req;
        if (body) {
            if (typeof body === 'object') {
                proxyReq.write(JSON.stringify(body));
            } else {
                proxyReq.write(body);
            }
        }
    }
}

/* Parse the ndjson as text */
app.use(bodyParser.text({ type: 'application/x-ndjson' }));

/* This is how we can extend this logic to do extra stuff before
 * sending requests to our backend for example doing verification
 * of access tokens or performing some other task */
app.use((req, res, next) => {
    const { body } = req;
    console.log('Verifying requests ✔', body);
    /* After this we call next to tell express to proceed
     * to the next middleware function which happens to be our
     * proxy middleware */
    next();
})

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors())
app.options('*', cors(corsOptions))



/* Here we proxy all the requests from reactivesearch to our backend */
app.use('*', cors(corsOptions), proxy(options));

app.listen(config.port, () => console.log('Server running at http://localhost:' + config.port + ' 🚀'));
