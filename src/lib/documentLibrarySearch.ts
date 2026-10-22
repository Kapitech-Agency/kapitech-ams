export interface DocumentLibraryReference {
  id: string;
  name: string;
}

export interface DocumentLibrarySearchRecord {
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  department?: string;
  type?: string;
  fileType?: string;
  accessLevel?: string;
  relatedEntity?: string;
  relatedId?: string;
  tags?: string[];
}

export const hasCanonicalDocumentLink = (doc: Pick<DocumentLibrarySearchRecord, 'relatedEntity' | 'relatedId'>): boolean => {
  const entity = String(doc.relatedEntity || '');
  return Boolean(String(doc.relatedId || '').trim() && (entity === 'Client' || entity === 'Project'));
};

export const documentLibrarySearchText = (
  doc: DocumentLibrarySearchRecord,
  clients: DocumentLibraryReference[],
  projects: DocumentLibraryReference[],
): string => {
  const entity = String(doc.relatedEntity || '');
  const relatedId = String(doc.relatedId || '').trim();
  const linkedRecords = entity === 'Client' ? clients : entity === 'Project' ? projects : [];
  const relatedName = relatedId ? linkedRecords.find((record) => record.id === relatedId)?.name : undefined;

  return [
    doc.name,
    doc.title,
    doc.description,
    doc.category,
    doc.department,
    doc.relatedEntity,
    doc.relatedId,
    relatedName,
    doc.accessLevel,
    doc.type,
    doc.fileType,
    ...(doc.tags || []),
  ].filter(Boolean).join(' ').toLowerCase();
};
