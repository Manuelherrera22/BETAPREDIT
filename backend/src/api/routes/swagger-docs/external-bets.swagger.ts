/**
 * @swagger
 * components:
 *   schemas:
 *     ExternalBet:
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
 *         platform:
 *           type: string
 *         marketType:
 *           type: string
 *         selection:
 *           type: string
 *         odds:
 *           type: number
 *         stake:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, WON, LOST, VOID, CANCELLED, PARTIAL_WIN]
 *         betPlacedAt:
 *           type: string
 *           format: date-time
 *         registeredAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/external-bets:
 *   post:
 *     summary: Registrar una apuesta externa
 *     tags: [External Bets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - marketType
 *               - selection
 *               - odds
 *               - stake
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               platform:
 *                 type: string
 *               marketType:
 *                 type: string
 *               selection:
 *                 type: string
 *               odds:
 *                 type: number
 *                 minimum: 1.01
 *                 maximum: 1000
 *               stake:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 10000
 *               currency:
 *                 type: string
 *                 default: USD
 *               betPlacedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Apuesta externa registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExternalBet'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Obtener mis apuestas externas
 *     tags: [External Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, WON, LOST, VOID, CANCELLED, PARTIAL_WIN]
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Lista de apuestas externas
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
 *                     $ref: '#/components/schemas/ExternalBet'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/external-bets/{betId}/result:
 *   patch:
 *     summary: Actualizar resultado de una apuesta externa
 *     tags: [External Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: betId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - result
 *             properties:
 *               result:
 *                 type: string
 *                 enum: [WON, LOST, VOID, CANCELLED]
 *               actualWin:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Resultado actualizado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Apuesta no encontrada
 */

/**
 * @swagger
 * /api/external-bets/{betId}:
 *   delete:
 *     summary: Eliminar una apuesta externa
 *     tags: [External Bets]
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
 *         description: Apuesta eliminada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Apuesta no encontrada
 */

