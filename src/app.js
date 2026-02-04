import express, { json } from 'express';
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import fs from 'fs';
import https from 'https';

import DBConection from './DBConection.js';

import userRouter from './routes/user.routes.js';
import InboundRouter from './routes/inbound.routes.js';
import OutboundRouter from './routes/outbound.routes.js';
import InventoryRouter from './routes/inventory.routes.js';
import LandingRouter from './routes/landing.routes.js';
import CustomerRouter from './routes/customer.routes.js';

const app = express();

dotenv.config();
DBConection();

app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:4200','https://vmi.wmsvantec.com.mx/login'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(morgan('dev'));
// app.use(helmet());

app.use('/auth',userRouter);
app.use('/inbound',InboundRouter);
app.use('/outbound',OutboundRouter);
app.use('/inventory',InventoryRouter);
app.use('/landing',LandingRouter);
app.use('/customer',CustomerRouter);
app.use('/uploads', express.static('uploads'));

// const httpsServer = https.createServer({
//             key: fs.readFileSync('/etc/letsencrypt/live/wmsvantec.com.mx/privkey.pem'),
//             cert: fs.readFileSync('/etc/letsencrypt/live/wmsvantec.com.mx/fullchain.pem')
//         },app);

app.listen(process.env.PORT || 3000,() => {
// httpsServer.listen(3006,() => {
    console.log('Server on port 3000');
});