/**
 * @swagger
 * components:
 *   schemas:
 *     ValueBetAlert:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         eventId:
 *           type: string
 *           format: uuid
 *         marketId:
 *           type: string
 *           format: uuid
 *         selection:
 *           type: string
 *         bookmakerOdds:
 *           type: number
 *         bookmakerPlatform:
 *           type: string
 *         predictedProbability:
 *           type: number
 *         expectedValue:
 *           type: number
 *         valuePercentage:
 *           type: number
 *         confidence:
 *           type: number
 *         status:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, TAKEN, INVALID]
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/value-bet-detection:
 *   post:
 *     summary: Detectar value bets
 *     description: Analiza eventos y detecta oportunidades de value bets
 *     tags: [Value Bets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               minValuePercentage:
 *                 type: number
 *                 default: 5
 *                 description: Porcentaje mínimo de valor requerido
 *               minConfidence:
 *                 type: number
 *                 default: 0.6
 *                 description: Confianza mínima del modelo
 *     responses:
 *       200:
 *         description: Value bets detectados
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
 *                     $ref: '#/components/schemas/ValueBetAlert'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/value-bet-alerts:
 *   get:
 *     summary: Obtener alertas de value bets
 *     tags: [Value Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, TAKEN, INVALID]
 *       - in: query
 *         name: minValuePercentage
 *         schema:
 *           type: number
 *         description: Porcentaje mínimo de valor
 *       - in: query
 *         name: sportId
 *         schema:
 *           type: string
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
 *         description: Lista de alertas de value bets
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
 *                     $ref: '#/components/schemas/ValueBetAlert'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/value-bet-alerts/{alertId}:
 *   get:
 *     summary: Obtener detalles de una alerta
 *     tags: [Value Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles de la alerta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ValueBetAlert'
 *       404:
 *         description: Alerta no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/value-bet-alerts/{alertId}/click:
 *   post:
 *     summary: Marcar alerta como clickeada
 *     tags: [Value Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Alerta marcada como clickeada
 *       404:
 *         description: Alerta no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/value-bet-analytics:
 *   get:
 *     summary: Obtener analytics de value bets
 *     description: Estadísticas y métricas sobre value bets detectados y tomados
 *     tags: [Value Bets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all_time]
 *           default: all_time
 *     responses:
 *       200:
 *         description: Analytics de value bets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDetected:
 *                       type: integer
 *                     totalTaken:
 *                       type: integer
 *                     totalWon:
 *                       type: integer
 *                     averageValuePercentage:
 *                       type: number
 *                     roi:
 *                       type: number
 */
