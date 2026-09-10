import { Linking } from 'react-native';
import { useGetStudyMaterialsQuery } from '../../store/api/apiSlice';
import { formatBytes, formatDate } from '../../utils/format';

/**
 * Study material a teacher has shared — notes, slides, links.
 *
 * The app does not render files. A material is either an external link or an uploaded file with a
 * URL, and both are handed to the device's browser rather than shown in-app: building a viewer for
 * whatever a teacher happened to upload (PDF, DOCX, PPTX, a video) is a much larger job than this
 * list, and pretending to open one that then fails silently would be worse than being clear.
 */
export const studyMaterialsModule = {
  key: 'StudyMaterials',
  title: 'Study Material',
  icon: 'file-document-multiple-outline',

  useList: () => useGetStudyMaterialsQuery({}),
  selectRows: (data) => data?.items ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.title, (row) => row.description, (row) => row.subjectId?.name],
  searchPlaceholder: 'Search notes and links',

  row: (row) => ({
    title: row.title,
    subtitle: [row.subjectId?.name, row.schoolClassId?.name].filter(Boolean).join(' · ') || row.description,
    meta: [
      row.uploadedBy?.name,
      row.createdAt ? formatDate(row.createdAt) : null,
      row.fileSize ? formatBytes(row.fileSize) : null,
    ]
      .filter(Boolean)
      .join(' · '),
    badge: row.type ? { label: row.type, tone: 'inactive' } : null,
  }),

  emptyIcon: 'file-document-outline',
  emptyLabel: 'No study material shared yet',

  detail: {
    title: 'Study Material',
    titleFor: (row) => row.title,
    fields: (row) => [
      { label: 'Subject', value: row.subjectId?.name },
      { label: 'Class', value: row.schoolClassId?.name },
      { label: 'Shared by', value: row.uploadedBy?.name },
      { label: 'Shared on', value: row.createdAt ? formatDate(row.createdAt) : null },
      { label: 'Description', value: row.description },
      { label: 'File', value: row.fileName },
      { label: 'Size', value: row.fileSize ? formatBytes(row.fileSize) : null },
    ],
    actions: [
      {
        key: 'open',
        label: 'Open in browser',
        icon: 'open-in-new',
        tone: 'primary',
        // Opening a link changes nothing about the record — stay put so returning from the
        // browser lands back on this material, not on the list.
        stayOnSuccess: true,
        allow: (ctx, row) => Boolean(row?.externalLink || row?.fileUrl),
        // Not an API call — this hands the URL to the OS. Shaped as a mutation hook so the engine
        // can treat it like any other action, and reports failure the same way a request would
        // (a link the device cannot handle rejects rather than doing nothing).
        useMutation: () => [
          (url) => ({
            unwrap: () =>
              Linking.canOpenURL(url).then((supported) => {
                if (!supported) throw new Error('This device cannot open that link');
                return Linking.openURL(url);
              }),
          }),
          { isLoading: false },
        ],
        buildArg: (row) => row.externalLink || row.fileUrl,
      },
    ],
  },
};
