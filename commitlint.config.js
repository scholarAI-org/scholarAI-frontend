export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // ميزة جديدة
        'fix', // إصلاح خطأ
        'docs', // تعديل توثيق فقط
        'style', // تنسيق كود (بدون تغيير منطق)
        'refactor', // إعادة هيكلة كود بدون تغيير سلوك
        'perf', // تحسين أداء
        'test', // إضافة أو تعديل اختبارات
        'chore', // مهام صيانة (تحديث حزم، إعدادات...)
        'ci', // تعديل على CI/CD
        'revert', // التراجع عن commit سابق
      ],
    ],
    'subject-case': [0], // يسمح بأحرف كبيرة أو صغيرة بالوصف
  },
};
