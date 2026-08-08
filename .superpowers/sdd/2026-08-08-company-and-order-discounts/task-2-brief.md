# Task 2: Arabic-Focused Localization for Companies & Order Discounts

**Files:**
- Modify: `src/i18n/ar.ts`
- Modify: `src/i18n/en.ts`

**Requirements & Global Constraints:**
1. In `src/i18n/ar.ts`:
   Add rich, authentic Arabic translations:
   - Company / Brand Management:
     - `"admin.companies.title": "إدارة الشركات والعلامات التجارية"`
     - `"admin.companies.subtitle": "إضافة وتعديل شعارات وأسماء الشركات والمصانع المصنعة للمنتجات"`
     - `"admin.companies.addCompany": "إضافة شركة جديدة"`
     - `"admin.companies.name": "اسم الشركة / العلامة التجارية"`
     - `"admin.companies.logo": "شعار الشركة (Logo)"`
     - `"admin.companies.description": "وصف الشركة (اختياري)"`
     - `"admin.companies.noCompanies": "لا توجد شركات مسجلة حالياً. أضف أول شركة أعلاه."`
     - `"admin.companies.deleteConfirm": "هل أنت متأكد من حذف هذه الشركة؟ سيتم إلغاء ربطها بالمنتجات المرتبطة."`
     - `"admin.companies.selectCompany": "اختر الشركة المصنعة (اختياري)"`
     - `"admin.companies.allCompanies": "جميع الشركات"`
     - `"admin.companies.companySaved": "تم حفظ بيانات الشركة بنجاح"`
     - `"admin.companies.companyDeleted": "تم حذف الشركة بنجاح"`
   - Order Discounts & Stacking:
     - `"admin.orders.applyDiscount": "تطبيق خصم وتأكيد الطلب"`
     - `"admin.orders.discountModalTitle": "خصومات وتأكيد الطلب رقم #{id}"`
     - `"admin.orders.itemDiscounts": "خصم على أصناف محددة"`
     - `"admin.orders.orderDiscount": "خصم إضافي على إجمالي الطلب"`
     - `"admin.orders.stackDiscount": "دمج مع الخصم الحالي (Stacking)"`
     - `"admin.orders.stackDiscountHelp": "عند التفعيل، يُحسب الخصم على السعر المخفض بالفعل، وإلا يُحسب على السعر الأصلي."`
     - `"admin.orders.originalTotal": "إجمالي الطلب الأصلي"`
     - `"admin.orders.totalSavings": "إجمالي قيمة الخصومات المطبقة"`
     - `"admin.orders.finalPayable": "المبلغ النهائي المطلوب للدفع"`
     - `"admin.orders.saveAndConfirm": "حفظ وتأكيد الطلب بالخصم"`
     - `"admin.orders.copyWhatsAppArabic": "نسخ رسالة الواتساب للعميل (بالعربية)"`
     - `"admin.orders.copiedWhatsApp": "تم نسخ رسالة الواتساب بنجاح!"`
     - `"admin.orders.discountAppliedSuccess": "تم تطبيق الخصم وتأكيد الطلب بنجاح"`
     - `"admin.orders.percentage": "نسبة مئوية (%)"`
     - `"admin.orders.fixed": "مبلغ ثابت (ج.م)"`

2. In `src/i18n/en.ts`:
   Add matching English translation keys to preserve `TranslationKey` type union parity.

3. Verification:
   - Run `npx tsc --noEmit`.
   - Commit with message: `feat(i18n): add Arabic and English translation keys for companies and order discounts`.
