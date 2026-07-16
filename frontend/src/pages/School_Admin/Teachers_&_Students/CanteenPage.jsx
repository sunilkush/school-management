import { useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Col, Empty, Flex, Input, InputNumber, Modal,
  Popconfirm, Row, Select, Space, Switch, Tabs, Table, Tag, Tooltip, Typography, message,
} from "antd";
import {
  CoffeeOutlined, CreditCardOutlined, DeleteOutlined, EditOutlined,
  MinusOutlined, PlusOutlined, ShoppingCartOutlined, UserOutlined, WalletOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { getClassData } from "../../../features/schoolClassSlice";
import { fetchSections } from "../../../features/sectionSlice";
import { fetchClassRollNumbers } from "../../../features/studentSlice";
import {
  fetchItems, createItem, updateItem, deleteItem,
  fetchWallet, topUpCash, createRazorpayTopUpOrder, verifyRazorpayTopUp, fetchTransactions,
  createOrder, fetchOrders, cancelOrder,
} from "../../../features/canteenSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text } = Typography;
const CATEGORIES = ["Breakfast", "Lunch", "Snacks", "Beverages", "Other"];
const fmtDateTime = (v) => (v ? dayjs(v).format("DD MMM YYYY, hh:mm A") : "—");

export default function CanteenPage() {
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { selectedAcademicYear } = useSelector((s) => s.academicYear);
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const { sections: allSections = [] } = useSelector((s) => s.section || {});
  const { rollNumberList = [], rollLoading = false } = useSelector((s) => s.students);
  const {
    items = [], wallet, transactions = [], orders = [], loading = false,
  } = useSelector((s) => s.canteen || {});

  const schoolId = user?.school?._id || user?.schoolId?._id || user?.schoolId;
  const academicYearId = selectedAcademicYear?._id;
  const canFilter = schoolId && academicYearId;

  /* ── Shared student picker ─────────────────────────────── */
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const studentName = useMemo(
    () => rollNumberList.find((s) => s.studentId === studentId)?.studentName || "",
    [rollNumberList, studentId]
  );

  /* ── Menu item form ─────────────────────────────────────── */
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: "", category: "Other", price: 0, isAvailable: true });
  const [savingItem, setSavingItem] = useState(false);

  /* ── Wallet / top-up ────────────────────────────────────── */
  const [topUpAmount, setTopUpAmount] = useState(null);
  const [cashSaving, setCashSaving] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  /* ── POS cart ───────────────────────────────────────────── */
  const [cart, setCart] = useState([]); // [{itemId, name, price, quantity}]
  const [placingOrder, setPlacingOrder] = useState(false);

  /* ── Orders filters ─────────────────────────────────────── */
  const [filterStatus, setFilterStatus] = useState(null);

  /* ── Load classes / sections / students ───────────────────── */
  useEffect(() => {
    if (schoolId && academicYearId) dispatch(getClassData({ schoolId, academicYearId }));
  }, [schoolId, academicYearId, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass) {
      dispatch(fetchSections({ schoolId, academicYearId, schoolClassId: selectedClass }));
      setSelectedSection(null);
      setStudentId(null);
    }
  }, [schoolId, academicYearId, selectedClass, dispatch]);

  useEffect(() => {
    if (schoolId && academicYearId && selectedClass && selectedSection) {
      dispatch(fetchClassRollNumbers({ schoolId, academicYearId, schoolClassId: selectedClass, sectionId: selectedSection }));
      setStudentId(null);
    }
  }, [schoolId, academicYearId, selectedClass, selectedSection, dispatch]);

  useEffect(() => {
    if (studentId) {
      dispatch(fetchWallet(studentId));
      dispatch(fetchTransactions({ studentId }));
      setCart([]);
    }
  }, [studentId, dispatch]);

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  const refreshOrders = () => {
    dispatch(fetchOrders({ studentId: studentId || undefined, status: filterStatus || undefined, page: 1, limit: 50 }));
  };
  useEffect(() => {
    refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, filterStatus]);

  const sectionOptions = useMemo(
    () => (allSections || []).map((s) => ({ value: s._id, label: s.name })),
    [allSections]
  );
  const studentOptions = useMemo(
    () => (rollNumberList || []).map((s) => ({ value: s.studentId, label: `${s.studentName || "—"} (Roll ${s.rollNumber ?? "—"})` })),
    [rollNumberList]
  );

  /* ── Menu item CRUD ─────────────────────────────────────── */
  const openItemModal = (item = null) => {
    setEditingItem(item || {});
    setItemForm(item ? { name: item.name, category: item.category, price: item.price, isAvailable: item.isAvailable } : { name: "", category: "Other", price: 0, isAvailable: true });
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) return message.warning("Item name is required");
    setSavingItem(true);
    const res = editingItem?._id
      ? await dispatch(updateItem({ id: editingItem._id, payload: itemForm }))
      : await dispatch(createItem(itemForm));
    setSavingItem(false);
    const action = editingItem?._id ? updateItem : createItem;
    if (action.fulfilled.match(res)) {
      message.success(`Item ${editingItem?._id ? "updated" : "created"}`);
      setEditingItem(null);
    } else {
      message.error(res.payload || "Failed to save item");
    }
  };

  const handleDeleteItem = async (id) => {
    const res = await dispatch(deleteItem(id));
    if (deleteItem.fulfilled.match(res)) message.success("Item deleted");
    else message.error(res.payload || "Failed to delete item");
  };

  /* ── Wallet top-up ──────────────────────────────────────── */
  const handleCashTopUp = async () => {
    if (!studentId) return message.warning("Please select a student first.");
    if (!topUpAmount || topUpAmount <= 0) return message.warning("Enter a valid amount.");
    setCashSaving(true);
    const res = await dispatch(topUpCash({ studentId, amount: topUpAmount }));
    setCashSaving(false);
    if (topUpCash.fulfilled.match(res)) {
      message.success("Wallet topped up (cash)");
      setTopUpAmount(null);
      dispatch(fetchTransactions({ studentId }));
    } else {
      message.error(res.payload || "Failed to top up wallet");
    }
  };

  const handleRazorpayTopUp = async () => {
    if (!studentId) return message.warning("Please select a student first.");
    if (!topUpAmount || topUpAmount <= 0) return message.warning("Enter a valid amount.");

    setRazorpayLoading(true);
    try {
      const orderRes = await dispatch(createRazorpayTopUpOrder({ studentId, amount: topUpAmount })).unwrap();

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency || "INR",
        name: "Canteen Wallet Top-Up",
        description: `Top-up for ${studentName || "student"}`,
        order_id: orderRes.orderId,
        handler: async (response) => {
          try {
            await dispatch(verifyRazorpayTopUp({
              studentId, amount: topUpAmount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();
            message.success("Wallet topped up via Razorpay");
            setTopUpAmount(null);
            dispatch(fetchTransactions({ studentId }));
          } catch {
            message.error("Payment verification failed. Contact support.");
          }
        },
        theme: { color: "#2563EB" },
        modal: { ondismiss: () => setRazorpayLoading(false) },
      };

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        message.error(`Payment failed: ${resp.error.description}`);
        setRazorpayLoading(false);
      });
      rzp.open();
    } catch (err) {
      message.error(typeof err === "string" ? err : "Could not initiate Razorpay top-up");
    } finally {
      setRazorpayLoading(false);
    }
  };

  /* ── POS cart ───────────────────────────────────────────── */
  const addToCart = (item) => {
    setCart((c) => {
      const existing = c.find((i) => i.itemId === item._id);
      if (existing) return c.map((i) => (i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...c, { itemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };
  const changeQty = (itemId, delta) => {
    setCart((c) => c
      .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity + delta } : i))
      .filter((i) => i.quantity > 0));
  };
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!studentId) return message.warning("Please select a student first.");
    if (!cart.length) return message.warning("Cart is empty.");
    setPlacingOrder(true);
    const res = await dispatch(createOrder({
      studentId,
      items: cart.map((c) => ({ itemId: c.itemId, quantity: c.quantity })),
    }));
    setPlacingOrder(false);
    if (createOrder.fulfilled.match(res)) {
      message.success(`Order placed — ₹${res.payload.totalAmount}`);
      setCart([]);
      dispatch(fetchWallet(studentId));
      dispatch(fetchTransactions({ studentId }));
      refreshOrders();
    } else {
      message.error(res.payload || "Failed to place order");
    }
  };

  /* ── Cancel order ───────────────────────────────────────── */
  const handleCancelOrder = async (id) => {
    const res = await dispatch(cancelOrder(id));
    if (cancelOrder.fulfilled.match(res)) {
      message.success("Order cancelled and refunded");
      if (studentId) dispatch(fetchWallet(studentId));
    } else {
      message.error(res.payload || "Failed to cancel order");
    }
  };

  /* ── Student picker (shared) ───────────────────────────── */
  const StudentPicker = (
    <div style={{ ...sectionPanel, marginBottom: 16 }}>
      <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
        <div style={iconWell("#2563EB", 38)}><UserOutlined style={{ fontSize: 17 }} /></div>
        <div>
          <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Select Student</Text>
          <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>Used for wallet top-up and placing orders</Text>
        </div>
      </Flex>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={6}>
          <Select placeholder="Select Class" style={{ width: "100%" }} value={selectedClass} onChange={setSelectedClass}
            options={(schoolClasses || []).map((c) => ({ value: c._id, label: c.name }))}
            showSearch optionFilterProp="label" disabled={!canFilter} size="large" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select placeholder="Select Section" style={{ width: "100%" }} value={selectedSection} onChange={setSelectedSection}
            options={sectionOptions} showSearch optionFilterProp="label" disabled={!selectedClass} size="large" />
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Select placeholder="Select Student" style={{ width: "100%" }} value={studentId} onChange={setStudentId}
            options={studentOptions} showSearch optionFilterProp="label" disabled={!selectedSection} loading={rollLoading} size="large" />
        </Col>
      </Row>
    </div>
  );

  /* ── Tab: Menu Items ────────────────────────────────────── */
  const itemColumns = [
    { title: "Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category", width: 120 },
    { title: "Price", dataIndex: "price", width: 90, render: (v) => `₹${v}` },
    { title: "Available", dataIndex: "isAvailable", width: 100, render: (v) => <Tag color={v ? "success" : "default"}>{v ? "Yes" : "No"}</Tag> },
    {
      title: "Actions", key: "actions", width: 100,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => openItemModal(row)} /></Tooltip>
          <Popconfirm title="Delete this item?" onConfirm={() => handleDeleteItem(row._id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const menuItemsTab = (
    <div style={sectionPanel}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
        <Text strong style={{ fontSize: 14 }}>Menu Items</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemModal()}>Add Item</Button>
      </Flex>
      <Table
        className="canteen-tbl" rowKey="_id" columns={itemColumns} dataSource={items} loading={loading}
        size="middle" pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="No menu items yet" style={{ padding: "40px 0" }} /> }}
      />
    </div>
  );

  /* ── Tab: Wallet & Top-Up ───────────────────────────────── */
  const txnColumns = [
    { title: "Date", dataIndex: "createdAt", render: (v) => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
    { title: "Type", dataIndex: "type", render: (v) => <Tag color={v === "TopUp" ? "success" : v === "Refund" ? "processing" : "error"}>{v}</Tag> },
    { title: "Amount", dataIndex: "amount", render: (v, row) => `${row.type === "Purchase" ? "-" : "+"}₹${v}` },
    { title: "Balance After", dataIndex: "balanceAfter", render: (v) => `₹${v}` },
    { title: "Mode", dataIndex: "paymentMode", render: (v) => v || "—" },
  ];

  const walletTab = (
    <div>
      {studentId ? (
        <>
          <div style={{ ...sectionPanel, marginBottom: 16 }}>
            <Flex align="center" gap={16} wrap="wrap">
              <div style={iconWell("#16A34A", 44)}><WalletOutlined style={{ fontSize: 20 }} /></div>
              <div>
                <Text style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Current Balance</Text>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#16A34A" }}>₹{wallet?.balance ?? 0}</div>
              </div>
              <div style={{ flex: 1 }} />
              <InputNumber min={1} placeholder="Amount" value={topUpAmount} onChange={setTopUpAmount} size="large" style={{ width: 140 }} />
              <Button icon={<PlusOutlined />} loading={cashSaving} onClick={handleCashTopUp} size="large">Top Up (Cash)</Button>
              <Button type="primary" icon={<CreditCardOutlined />} loading={razorpayLoading} onClick={handleRazorpayTopUp} size="large">
                Top Up via Razorpay
              </Button>
            </Flex>
          </div>
          <div style={sectionPanel}>
            <Text strong style={{ fontSize: 14, marginBottom: 14, display: "block" }}>Transaction History</Text>
            <Table
              className="canteen-tbl" rowKey="_id" columns={txnColumns} dataSource={transactions} loading={loading}
              size="middle" pagination={{ pageSize: 20 }}
              locale={{ emptyText: <Empty description="No transactions yet" style={{ padding: "40px 0" }} /> }}
            />
          </div>
        </>
      ) : (
        <div style={{ ...sectionPanel, textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary">Select a student above to view their wallet</Text>
        </div>
      )}
    </div>
  );

  /* ── Tab: New Order (POS) ───────────────────────────────── */
  const posTab = (
    <div>
      {studentId ? (
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <div style={sectionPanel}>
              <Text strong style={{ fontSize: 14, marginBottom: 14, display: "block" }}>Menu</Text>
              <Row gutter={[10, 10]}>
                {items.filter((i) => i.isAvailable).map((item) => (
                  <Col xs={12} sm={8} key={item._id}>
                    <div
                      onClick={() => addToCart(item)}
                      style={{ border: "1px solid var(--border-muted)", borderRadius: 10, padding: 12, cursor: "pointer", background: "var(--surface)" }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.category}</div>
                      <div style={{ fontWeight: 700, color: "#2563EB", marginTop: 4 }}>₹{item.price}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Col>
          <Col xs={24} md={10}>
            <div style={sectionPanel}>
              <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
                <ShoppingCartOutlined />
                <Text strong style={{ fontSize: 14 }}>Cart</Text>
              </Flex>
              {cart.length === 0 ? (
                <Empty description="Cart is empty — tap a menu item to add" style={{ padding: "20px 0" }} />
              ) : (
                <>
                  {cart.map((c) => (
                    <Flex key={c.itemId} align="center" justify="space-between" style={{ marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>₹{c.price} × {c.quantity}</div>
                      </div>
                      <Space>
                        <Button size="small" icon={<MinusOutlined />} onClick={() => changeQty(c.itemId, -1)} />
                        <Text strong>{c.quantity}</Text>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => changeQty(c.itemId, 1)} />
                      </Space>
                    </Flex>
                  ))}
                  <Flex align="center" justify="space-between" style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--border-muted)" }}>
                    <Text strong>Total</Text>
                    <Text strong style={{ fontSize: 18, color: "#2563EB" }}>₹{cartTotal}</Text>
                  </Flex>
                  {wallet && cartTotal > wallet.balance && (
                    <Alert type="warning" showIcon message="Insufficient wallet balance" style={{ marginTop: 10, borderRadius: 8 }} />
                  )}
                  <Button type="primary" block size="large" style={{ marginTop: 14 }} loading={placingOrder} onClick={handlePlaceOrder}>
                    Place Order
                  </Button>
                </>
              )}
            </div>
          </Col>
        </Row>
      ) : (
        <div style={{ ...sectionPanel, textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary">Select a student above to place an order</Text>
        </div>
      )}
    </div>
  );

  /* ── Tab: Orders ────────────────────────────────────────── */
  const orderColumns = [
    { title: "Date", dataIndex: "orderDate", render: (v) => <span style={{ fontSize: 12 }}>{fmtDateTime(v)}</span> },
    { title: "Student", dataIndex: "studentName" },
    { title: "Items", dataIndex: "items", render: (v) => v.map((i) => `${i.name} x${i.quantity}`).join(", ") },
    { title: "Total", dataIndex: "totalAmount", render: (v) => `₹${v}` },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={v === "Completed" ? "success" : "error"}>{v}</Tag> },
    {
      title: "Actions", key: "actions", width: 90,
      render: (_, row) => (
        row.status === "Completed" ? (
          <Popconfirm title="Cancel & refund this order?" onConfirm={() => handleCancelOrder(row._id)}>
            <Button size="small" danger>Cancel</Button>
          </Popconfirm>
        ) : "—"
      ),
    },
  ];

  const ordersTab = (
    <div style={sectionPanel}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
        <Text strong style={{ fontSize: 14 }}>{studentId ? "Orders for Selected Student" : "All Orders"}</Text>
        <Select
          placeholder="Filter by Status" allowClear style={{ width: 180 }}
          value={filterStatus} onChange={setFilterStatus}
          options={[{ value: "Completed", label: "Completed" }, { value: "Cancelled", label: "Cancelled" }]}
        />
      </Flex>
      <Table
        className="canteen-tbl" rowKey="_id" columns={orderColumns} dataSource={orders} loading={loading}
        size="middle" scroll={{ x: 700 }} pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="No orders yet" style={{ padding: "40px 0" }} /> }}
      />
    </div>
  );

  return (
    <>
      <style>{tableHeadCss("canteen-tbl")}</style>

      <PageHeader
        title="Canteen"
        subtitle="Menu, student wallets, and point-of-sale ordering"
        icon={<CoffeeOutlined />}
      />

      <div style={pageWrapper}>
        {!canFilter && (
          <Alert type="warning" showIcon message="Please select an active academic year to use the canteen module." style={{ borderRadius: 12, marginBottom: 16 }} />
        )}

        {StudentPicker}

        <Tabs
          defaultActiveKey="menu"
          items={[
            { key: "menu", label: "Menu Items", children: menuItemsTab },
            { key: "wallet", label: "Wallet & Top-Up", children: walletTab },
            { key: "pos", label: "New Order (POS)", children: posTab },
            { key: "orders", label: "Orders", children: ordersTab },
          ]}
        />
      </div>

      {/* ── Add/Edit Item Modal ──────────────────────────────── */}
      <Modal
        open={!!editingItem}
        onCancel={() => setEditingItem(null)}
        onOk={handleSaveItem}
        confirmLoading={savingItem}
        okText="Save"
        title={editingItem?._id ? "Edit Menu Item" : "Add Menu Item"}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>NAME</Text>
            <Input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>CATEGORY</Text>
              <Select style={{ width: "100%" }} value={itemForm.category} onChange={(v) => setItemForm((f) => ({ ...f, category: v }))} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>PRICE (₹)</Text>
              <InputNumber min={0} style={{ width: "100%" }} value={itemForm.price} onChange={(v) => setItemForm((f) => ({ ...f, price: v }))} />
            </Col>
          </Row>
          <Flex align="center" gap={10}>
            <Switch checked={itemForm.isAvailable} onChange={(v) => setItemForm((f) => ({ ...f, isAvailable: v }))} />
            <Text style={{ fontSize: 13 }}>Available</Text>
          </Flex>
        </Space>
      </Modal>
    </>
  );
}
