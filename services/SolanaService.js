require('dotenv').config();

const mongoose = require('mongoose');

const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');

const { MINT_ACCOUNT_SECRET_KEY } = process.env;
const { HELIUS_API_KEY } = process.env;

mongoose.set('debug', true);

class SolanaService {
  /**
   *
   * @param {String} transactionID
   * @param {Number} transaction amount value
   * @param {String} memo message
   * @return {Array} array with 1 transaction
   */

  static async withdrawalSPL(userWallet, amount, memo = '') {
    console.log('withdrawalSPL start');

    const DEMO_WALLET_SECRET_KEY = Uint8Array.from(JSON.parse(MINT_ACCOUNT_SECRET_KEY));
    const fromWalletOwner = solanaWeb3.Keypair.fromSecretKey(DEMO_WALLET_SECRET_KEY);
    const fromPubkey = fromWalletOwner.publicKey;
    const toPubkey = new solanaWeb3.PublicKey(userWallet);

    let transaction;
    console.log('amount', amount);
    try {
      // eslint-disable-next-line max-len
      const connection = new solanaWeb3.Connection(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 120000,
      });

      const mintPublicKey = new solanaWeb3.PublicKey('igYvQesuheKUuvkGS5YnK6HX4udg86Dxbce6TZncqEx');

      const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        fromPubkey,
        mintPublicKey,
        fromPubkey,
        fromWalletOwner,
      );

      const toTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        fromWalletOwner,
        mintPublicKey,
        toPubkey,
        fromWalletOwner,
      );

      transaction = new solanaWeb3.Transaction().add(
        new solanaWeb3.TransactionInstruction({
          keys: [{
            pubkey: fromPubkey,
            isSigner: true,
            isWritable: false,
          }],
          programId: new solanaWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
          data: Buffer.from(memo.substring(0, 250), 'utf8'),
        }),
        splToken.createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          fromPubkey,
          amount * solanaWeb3.LAMPORTS_PER_SOL,
          [],
          splToken.TOKEN_PROGRAM_ID,
        ),
      );

      const bk = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = bk.blockhash;
      transaction.feePayer = fromPubkey;

      const transactionSignature = await solanaWeb3.sendAndConfirmTransaction(
        connection,
        transaction,
        [fromWalletOwner],
      );

      if (transactionSignature) {
        return transactionSignature;
      }

      return null;
    } catch (error) {
      console.error('getTransactionDetails Error: ', error);
      throw new Error(error.message);
    }
  }
}

module.exports = SolanaService;
