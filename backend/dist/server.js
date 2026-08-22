"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const app = (0, express_1.default)();
const PORT = config_1.config.port;
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cobly backend is running' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
