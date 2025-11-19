import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSubscriptionPlans,
  deleteSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  fetchPlanLogs,
} from "../../../features/subscriptionPlanSlice";

import { Table, Card, Button, Tag, Space, Popconfirm, Modal } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

import PlanForm from "../../../components/forms/PlanForm.jsx";
import PlanLogs from "./PlanLogs.jsx";

const SubscriptionPlans = () => {
  const dispatch = useDispatch();
  const { plans, loading } = useSelector((state) => state.subscriptionPlans);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const openLogsPopup = (id) => {
    setSelectedPlanId(id);
    dispatch(fetchPlanLogs(id));
    setIsLogsOpen(true);
  };

  const handleSubmit = (data) => {
    if (editingPlan) {
      dispatch(updateSubscriptionPlan({ id: editingPlan._id, formData: data }));
    } else {
      dispatch(createSubscriptionPlan(data));
    }
    setIsModalOpen(false);
  };

  const columns = [
    { title: "Plan Name", dataIndex: "name" },
    {
      title: "Price",
      dataIndex: "price",
      render: (p) => <Tag color="green">₹{p}</Tag>,
    },
    {
      title: "Duration",
      dataIndex: "durationInDays",
      render: (d) => <Tag color="blue">{d} Days</Tag>,
    },
    {
      title: "Features",
      dataIndex: "features",
      render: (features) => {
        if (!features || !features.length) return null;
        const displayModules = features.map((f) => f.module || "").filter(Boolean);
        const firstTwo = displayModules.slice(0, 2).join(", ");
        const more = displayModules.length - 2;
        return (
          <Tag color="purple">
            {firstTwo} {more > 0 ? `+${more} more` : ""}
          </Tag>
        );
      },
    },
    {
      title: "Logs",
      render: (_, row) => (
        <Button type="link" onClick={() => openLogsPopup(row._id)}>
          View Logs
        </Button>
      ),
    },
    {
      title: "Actions",
      render: (_, row) => (
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete Plan?"
            onConfirm={() => dispatch(deleteSubscriptionPlan(row._id))}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-5">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-semibold">Subscription Plans</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Plan
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <Card bordered className="shadow-md">
          <Table
            columns={columns}
            dataSource={plans}
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {plans.map((plan) => (
          <Card key={plan._id} className="shadow-md border rounded-md p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <div className="flex gap-1">
                <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => openEditModal(plan)}>
                  Edit
                </Button>
                <Popconfirm
                  title="Delete Plan?"
                  onConfirm={() => dispatch(deleteSubscriptionPlan(plan._id))}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            </div>

            <p><span className="font-semibold">Price:</span> <Tag color="green">₹{plan.price}</Tag></p>
            <p><span className="font-semibold">Duration:</span> <Tag color="blue">{plan.durationInDays} Days</Tag></p>
            <p>
              <span className="font-semibold">Features:</span>{" "}
              <Tag color="purple">
                {plan.features.map(f => f.module).slice(0, 2).join(", ")}
                {plan.features.length > 2 ? ` +${plan.features.length - 2} more` : ""}
              </Tag>
            </p>
            <Button type="link" onClick={() => openLogsPopup(plan._id)}>
              View Logs
            </Button>
          </Card>
        ))}
      </div>

      {/* Add/Edit Plan Modal */}
      <Modal
        title={editingPlan ? "Edit Subscription Plan" : "Add New Plan"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <PlanForm
          initialValues={editingPlan}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* Logs Modal */}
      <Modal
        title="Plan Update Logs"
        width={850}
        height={500}
        open={isLogsOpen}
        onCancel={() => setIsLogsOpen(false)}
        footer={null}
      >
        {selectedPlanId && <PlanLogs planId={selectedPlanId} />}
      </Modal>
    </div>
  );
};

export default SubscriptionPlans;
