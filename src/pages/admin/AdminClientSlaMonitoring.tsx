import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminModuleHeader, AdminPageShell, AdminSectionTabs } from '../../components/admin/AdminModulePrimitives';
import { CLIENT_SERVICE_TABS, ClientSourceWorkspace, ClientSourceWorksheet } from '../../components/admin/clients/ClientWorkspace';

export const AdminClientSlaMonitoring: React.FC = () => {
  const [params] = useSearchParams();
  const active = CLIENT_SERVICE_TABS.find(item => item.key === params.get('view'))?.key || 'sla-monitoring';
  return <AdminPageShell featureSlug="client-sla-monitoring-module" className="ams-clients-module">
    <AdminModuleHeader slug="client-sla-monitoring-header" title="Service & Health" eyebrow="Client relationships" description="Review service commitments, client issues and relationship evidence in their owning workspaces." />
    <AdminSectionTabs ariaLabel="Service and health worksheets" activeKey={active} className="ams-operational-tabs" items={CLIENT_SERVICE_TABS} />
    <ClientSourceWorkspace worksheet={active as ClientSourceWorksheet} />
  </AdminPageShell>;
};
export default AdminClientSlaMonitoring;
