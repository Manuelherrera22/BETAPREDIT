/**
 * @swagger
 * components:
 *   schemas:
 *     Referral:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         referrerId:
 *           type: string
 *           format: uuid
 *         referredUserId:
 *           type: string
 *           format: uuid
 *         referralCode:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, ACTIVE, REWARDED, EXPIRED]
 *         rewardGranted:
 *           type: boolean
 *         rewardType:
 *           type: string
 *         rewardValue:
 *           type: number
 *         convertedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/referrals/code:
 *   get:
 *     summary: Obtener mi código de referido
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código de referido
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
 *                     referralCode:
 *                       type: string
 *                     referralUrl:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/referrals:
 *   get:
 *     summary: Obtener mis referidos
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, REWARDED, EXPIRED]
 *     responses:
 *       200:
 *         description: Lista de referidos
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
 *                     $ref: '#/components/schemas/Referral'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/referrals/stats:
 *   get:
 *     summary: Obtener estadísticas de referidos
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de referidos
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
 *                     totalReferrals:
 *                       type: integer
 *                     activeReferrals:
 *                       type: integer
 *                     rewardsGranted:
 *                       type: integer
 *                     totalRewardsValue:
 *                       type: number
 */

/**
 * @swagger
 * /api/referrals/use/{code}:
 *   post:
 *     summary: Usar código de referido
 *     tags: [Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Código aplicado exitosamente
 *       400:
 *         description: Código inválido o ya usado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
