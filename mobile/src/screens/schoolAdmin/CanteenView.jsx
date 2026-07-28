import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { StudentPicker } from '../../components/ui/StudentPicker';
import { CreateCanteenItemSheet } from './CreateCanteenItemSheet';
import { CanteenOrderSheet } from './CanteenOrderSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import { confirmDelete } from '../../utils/confirm';
import {
  useGetCanteenItemsQuery,
  useDeleteCanteenItemMutation,
  useGetCanteenOrdersQuery,
  useCancelCanteenOrderMutation,
  useGetCanteenWalletQuery,
  useGetCanteenTransactionsQuery,
  useTopUpCanteenCashMutation,
} from '../../store/api/apiSlice';

const ORDER_STATUS_COLOR = { Completed: '#22C55E', Cancelled: '#EF4444', Pending: '#F59E0B' };
const TXN_COLOR = { TopUp: '#22C55E', Purchase: '#EF4444', Refund: '#2563EB' };
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

function ItemsTab() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetCanteenItemsQuery();
  const items = data ?? [];
  const [deleteItem, deleteState] = useDeleteCanteenItemMutation();

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} compact>New Item</Button>
      </View>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={items.length === 0} emptyIcon="food-outline" emptyLabel="No menu items yet">
        {items.map((item) => (
          <AccentListCard
            key={item._id}
            accent={item.isAvailable ? colors.primary : '#94A3B8'}
            avatar={<IconWell icon="food-outline" color={item.isAvailable ? colors.primary : '#94A3B8'} size={40} />}
            title={item.name}
            subtitle={item.category}
            badge={<StatusPill label={`₹${item.price}`} color={colors.primary} />}
            actions={<Button compact textColor={colors.danger} loading={deleteState.isLoading} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteItem(item._id), 'this item')}>Delete</Button>}
          />
        ))}
      </QueryState>
      <CreateCanteenItemSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </>
  );
}

function OrdersTab() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetCanteenOrdersQuery({ limit: 30 });
  const orders = data?.orders ?? [];
  const [cancelOrder, cancelState] = useCancelCanteenOrderMutation();

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} compact>New Order</Button>
      </View>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={orders.length === 0} emptyIcon="cart-outline" emptyLabel="No orders placed yet">
        {orders.map((order) => (
          <AccentListCard
            key={order._id}
            accent={ORDER_STATUS_COLOR[order.status] || colors.primary}
            avatar={<IconWell icon="cart-outline" color={ORDER_STATUS_COLOR[order.status] || colors.primary} size={40} />}
            title={order.studentName}
            subtitle={`${order.items?.length ?? 0} items · ₹${order.totalAmount}`}
            badge={<StatusPill label={order.status} color={ORDER_STATUS_COLOR[order.status] || colors.textMuted} />}
            meta={(order.items ?? []).map((i) => ({ label: i.name, value: `x${i.quantity} · ₹${i.price * i.quantity}` }))}
            expandable
            actions={order.status !== 'Cancelled' ? (
              <Button compact textColor={colors.danger} loading={cancelState.isLoading} disabled={cancelState.isLoading} onPress={() => cancelOrder(order._id)}>
                Cancel & Refund
              </Button>
            ) : null}
          />
        ))}
      </QueryState>
      <CanteenOrderSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </>
  );
}

function WalletTab() {
  const { colors, typography, spacing } = useAppTheme();
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(null);

  const walletQuery = useGetCanteenWalletQuery(studentId, { skip: !studentId });
  const txnQuery = useGetCanteenTransactionsQuery(studentId, { skip: !studentId });
  const transactions = txnQuery.data?.transactions ?? [];
  const [topUpCash, topUpState] = useTopUpCanteenCashMutation();

  const handleTopUp = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError('Enter a valid amount'); return; }
    try {
      await topUpCash({ studentId, amount: numericAmount }).unwrap();
      setAmount('');
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to top up');
    }
  };

  return (
    <>
      <StudentPicker
        selectedId={studentId}
        selectedName={studentName}
        onSelect={(id, name) => { setStudentId(id); setStudentName(name); }}
        onClear={() => setStudentId(null)}
      />

      {studentId && (
        <QueryState isLoading={walletQuery.isLoading} isError={walletQuery.isError} error={walletQuery.error} onRetry={walletQuery.refetch}>
          <StatGrid>
            <StatCard label="Balance" metric={{ label: 'Balance', icon: 'wallet-outline', color: colors.primary, value: walletQuery.data?.balance ?? 0, format: 'currency' }} />
          </StatGrid>

          <View style={{ marginTop: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.surfaceSoft }}>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TOP UP (CASH)</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TextInput value={amount} onChangeText={setAmount} mode="outlined" keyboardType="decimal-pad" placeholder="Amount" style={{ flex: 1 }} dense />
              <Button mode="contained" onPress={handleTopUp} loading={topUpState.isLoading} disabled={topUpState.isLoading}>Add</Button>
            </View>
            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>}
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TRANSACTIONS</Text>
          <QueryState isLoading={txnQuery.isLoading} isError={txnQuery.isError} error={txnQuery.error} onRetry={txnQuery.refetch} isEmpty={transactions.length === 0} emptyIcon="history" emptyLabel="No transactions yet">
            {transactions.map((t) => (
              <AccentListCard
                key={t._id}
                accent={TXN_COLOR[t.type] || colors.primary}
                title={t.type}
                subtitle={fmtDateTime(t.createdAt)}
                badge={<StatusPill label={`${t.type === 'Purchase' ? '-' : '+'}₹${t.amount}`} color={TXN_COLOR[t.type] || colors.textMuted} />}
                meta={[{ label: 'Balance After', value: `₹${t.balanceAfter}` }, { label: 'Mode', value: t.paymentMode || '—' }]}
                expandable
              />
            ))}
          </QueryState>
        </QueryState>
      )}
    </>
  );
}

/** Reused across School Admin, Principal, Vice Principal — same CANTEEN_ROLES gate as web's
 * canteen.routes.js. Three grouped sub-lists in one screen, same pattern as SportsView.jsx. */
export function CanteenView() {
  const { colors, typography, spacing } = useAppTheme();
  const [tab, setTab] = useState('items');

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="food-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Canteen</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Menu, orders, and student wallets
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <Chip selected={tab === 'items'} onPress={() => setTab('items')}>Menu</Chip>
        <Chip selected={tab === 'orders'} onPress={() => setTab('orders')}>Orders</Chip>
        <Chip selected={tab === 'wallet'} onPress={() => setTab('wallet')}>Wallet</Chip>
      </View>

      {tab === 'items' && <ItemsTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'wallet' && <WalletTab />}
    </ScreenContainer>
  );
}
