import { useState, useEffect, useRef } from 'react';
import { paymentsAPI } from '../../services/api';
import { Phone, CheckCircle, XCircle, Loader2, Smartphone } from 'lucide-react';

interface Props {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
  onClose: () => void;
}

type Stage = 'enter_phone' | 'waiting' | 'success' | 'failed';

const PaymentModal = ({ bookingId, amount, onSuccess, onFailure, onClose }: Props) => {
  const [stage, setStage] = useState<Stage>('enter_phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const pollRef = useRef<any>(null);

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  const handlePay = async () => {
    const cleaned = phone.trim().replace(/\s/g, '');
    if (!cleaned) return setError('Please enter your M-Pesa phone number');
    if (!/^(07|01|2547|2541)\d{7,8}$/.test(cleaned)) {
      return setError('Enter a valid Safaricom number e.g. 0712345678');
    }

    setError('');
    setLoading(true);
    try {
      await paymentsAPI.initiate(bookingId, cleaned);
      setStage('waiting');
      startPolling();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to send payment request');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    let attempts = 0;
    const MAX = 24; // poll for 2 minutes (24 × 5s)

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await paymentsAPI.status(bookingId);
        const { payment_status, mpesa_receipt } = res.data;

        if (payment_status === 'paid') {
          clearInterval(pollRef.current);
          setReceipt(mpesa_receipt || '');
          setStage('success');
          onSuccess();
        } else if (payment_status === 'failed') {
          clearInterval(pollRef.current);
          setStage('failed');
          onFailure();
        } else if (attempts >= MAX) {
          clearInterval(pollRef.current);
          setStage('failed');
          onFailure();
        }
      } catch {
        // keep polling on network errors
      }
    }, 5000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-lg">Pay with M-Pesa</p>
              <p className="text-emerald-100 text-sm">KSh {Number(amount).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-6">

          {/* Stage: Enter Phone */}
          {stage === 'enter_phone' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Enter the M-Pesa number to send the payment prompt to.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 text-sm"
                  />
                </div>
                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <p className="text-xs text-green-700 font-medium">How it works</p>
                <p className="text-xs text-green-600 mt-0.5">
                  You'll receive a prompt on your phone. Enter your M-Pesa PIN to complete payment. Your booking is confirmed only after payment.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Prompt'}
                </button>
              </div>
            </div>
          )}

          {/* Stage: Waiting */}
          {stage === 'waiting' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Check your phone</p>
                <p className="text-sm text-gray-400 mt-1">
                  A payment prompt has been sent to <span className="font-semibold text-gray-600">{phone}</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Enter your M-Pesa PIN to complete payment</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  ⏱ Waiting for confirmation... This may take up to 30 seconds.
                </p>
              </div>
            </div>
          )}

          {/* Stage: Success */}
          {stage === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">Payment Successful!</p>
                <p className="text-sm text-gray-400 mt-1">Your booking has been submitted to the specialist.</p>
                {receipt && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">M-Pesa Receipt</p>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">{receipt}</p>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Stage: Failed */}
          {stage === 'failed' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-gray-800">Payment Failed</p>
                <p className="text-sm text-gray-400 mt-1">
                  The payment was not completed. Your booking has been cancelled.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => { setStage('enter_phone'); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
