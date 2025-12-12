/**
 * @swagger
 * components:
 *   schemas:
 *     ArbitrageOpportunity:
 *       type: object
 *       properties:
 *         eventId:
 *           type: string
 *           format: uuid
 *         marketId:
 *           type: string
 *           format: uuid
 *         selection:
 *           type: string
 *         profitMargin:
 *           type: number
 *           description: Margen de ganancia garantizado (%)
 *         stakeDistribution:
 *           type: object
 *           description: Distribución de stake en cada plataforma
 *         platforms:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *               odds:
 *                 type: number
 *               stake:
 *                 type: number
 *         guaranteedProfit:
 *           type: number
 *         totalStake:
 *           type: number
 */

/**
 * @swagger
 * /api/arbitrage/opportunities:
 *   get:
 *     summary: Obtener oportunidades de arbitraje
 *     description: Detecta oportunidades de arbitraje entre diferentes plataformas
 *     tags: [Arbitrage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minProfitMargin
 *         schema:
 *           type: number
 *           default: 1
 *         description: Margen de ganancia mínimo requerido (%)
 *       - in: query
 *         name: sportId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de oportunidades de arbitraje
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
 *                     $ref: '#/components/schemas/ArbitrageOpportunity'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/arbitrage/calculate:
 *   post:
 *     summary: Calcular distribución de arbitraje
 *     description: Calcula la distribución óptima de stake para una oportunidad de arbitraje
 *     tags: [Arbitrage]
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
 *               - selection
 *               - totalStake
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               marketId:
 *                 type: string
 *                 format: uuid
 *               selection:
 *                 type: string
 *               totalStake:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Distribución calculada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ArbitrageOpportunity'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
