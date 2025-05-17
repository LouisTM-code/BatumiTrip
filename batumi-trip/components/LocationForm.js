// file: components/LocationForm.js
'use client';
import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ChooseTag from '@/components/ChooseTag';
import AttachImage from '@/components/AttachImage';
import FormHeader from '@/components/FormHeader';
import FormNavigation from '@/components/FormNavigation';
import { useAddLocation } from '@/hooks/useAddLocation';
import { useUpdateLocation } from '@/hooks/useUpdateLocation';
import toast from 'react-hot-toast';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import successAnimation from '@/public/saveSuccess.json';

export default function LocationForm({ initialData = {}, onSuccess }) {
  const router = useRouter();
  const { dirId } = useParams() || {};
  const addLocation = useAddLocation();
  const updateLocation = useUpdateLocation();
  const isEditMode = Boolean(initialData.id);

  const {
    control,
    register,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      address: initialData.address || '',
      cost: initialData.cost || '',
      sourceUrl: initialData.sourceUrl || '',
      tags: initialData.tags || [],
      imageFile: null,
    },
  });

  const totalSteps = 2;
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const savedIdRef = useRef(null);

  const onSubmit = (data) => {
    const payload = {
      title: data.title,
      description: data.description,
      address: data.address,
      cost: data.cost,
      sourceUrl: data.sourceUrl,
      imageFile: data.imageFile,
      imgUrl: initialData.imgUrl || null,
      tags: data.tags,
    };

    if (isEditMode) {
      updateLocation.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            savedIdRef.current = initialData.id;
          },
          onError: (err) => toast.error(err.message),
        }
      );
    } else {
      addLocation.mutate(payload, {
        onSuccess: (loc) => {
          savedIdRef.current = loc.id;
        },
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const wrappedSubmit = handleSubmit(onSubmit);

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      // на первом шаге возвращаем в ветку
      const target = dirId || initialData.direction_id;
      router.push(`/destination/${target}`);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Lottie
          animationData={successAnimation}
          loop={false}
          autoplay
          className="h-48 w-48"
          onComplete={() => {
            if (savedIdRef.current) {
              const target = dirId || initialData.direction_id;
              router.push(`/destination/${target}/locations/${savedIdRef.current}`);
            } else {
              const target = dirId || initialData.direction_id;
              router.push(`/destination/${target}`);
            }
            onSuccess?.();
          }}
        />
        <p className="mt-6 text-lg font-semibold text-center">Сохраняем…</p>
      </div>
    );
  }

  const titles = ['Основная информация', 'Дополнительные детали'];
  const nextTitles = ['Подробности', null];

  return (
    <motion.form
      onSubmit={(e) => {
        e.preventDefault();
        if (step < totalSteps) {
          const fieldsToValidate = step === 1 ? ['title'] : [];
          trigger(fieldsToValidate).then((valid) => {
            if (valid) setStep((s) => s + 1);
          });
        } else {
          setShowSuccess(true);
          wrappedSubmit();
        }
      }}
      aria-label="Форма локации"
      className="w-full max-w-2xl mx-auto space-y-6 pb-32 md:pb-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FormHeader
        currentStep={step}
        totalSteps={totalSteps}
        title={titles[step - 1]}
        nextTitle={nextTitles[step - 1]}
      />

      <AnimatePresence mode="wait" initial={false}>
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <label htmlFor="title" className="block text-sm font-medium">
                Заголовок<span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                {...register('title', { required: 'Обязательное поле' })}
                className="mt-1 w-full"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive-foreground">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium">
                Описание
              </label>
              <Textarea
                id="description"
                {...register('description')}
                className="mt-1 w-full"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Теги</label>
              <ChooseTag control={control} name="tags" />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <label htmlFor="address" className="block text-sm font-medium">
                Адрес
              </label>
              <Input id="address" {...register('address')} className="mt-1 w-full" />
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-medium">
                Стоимость
              </label>
              <Input id="cost" {...register('cost')} className="mt-1 w-full" />
            </div>

            <div>
              <label htmlFor="sourceUrl" className="block text-sm font-medium">
                Ссылка на источник
              </label>
              <Input
                id="sourceUrl"
                {...register('sourceUrl')}
                className="mt-1 w-full break-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Изображение</label>
              <AttachImage
                control={control}
                name="imageFile"
                initialUrl={initialData.imgUrl}
                className="mt-1"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FormNavigation
        currentStep={step}
        totalSteps={totalSteps}
        onBack={handleBack}
        isSubmitting={addLocation.isLoading || updateLocation.isLoading}
      />
    </motion.form>
  );
}
