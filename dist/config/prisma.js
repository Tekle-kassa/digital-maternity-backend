"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/prisma.ts
// import { PrismaClient } from "@prisma/client";
// import { PrismaClient } from "../generated/prisma/client";
const client_1 = require("../generated/prisma/client");
const prisma = new client_1.PrismaClient();
exports.default = prisma;
