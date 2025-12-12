/**
 * @swagger
 * components:
 *   schemas:
 *     Bet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         eventId:
 *           type: string
 *           format: uuid
 *         marketId:
 *           type: string
 *           format: uuid
 *         oddsId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [SINGLE, MULTIPLE, SYSTEM]
 *         selection:
 *           type: string
 *         stake:
 *           type: number
 *         potentialWin:
 *           type: number
 *         oddsDecimal:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, WON, LOST, VOID, CANCELLED]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bets:
 *   post:
 *     summary: Realizar una apuesta
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - marketId
 *               - oddsId
 *               - type
 *               - selection
 *               - stake
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               marketId:
 *                 type: string
 *                 format: uuid
 *               oddsId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [SINGLE, MULTIPLE, SYSTEM]
 *               selection:
 *                 type: string
 *               stake:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 10000
 *     responses:
 *       201:
 *         description: Apuesta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/bets/my-bets:
 *   get:
 *     summary: Obtener mis apuestas
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, WON, LOST, VOID, CANCELLED]
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Lista de apuestas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bet'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/bets/{betId}:
 *   get:
 *     summary: Obtener detalles de una apuesta
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: betId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles de la apuesta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Bet'
 *       404:
 *         description: Apuesta no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   delete:
 *     summary: Cancelar una apuesta
 *     tags: [Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: betId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Apuesta cancelada exitosamente
 *       404:
 *         description: Apuesta no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

