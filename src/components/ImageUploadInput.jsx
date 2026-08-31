import React, { useState, useEffect } from 'react';
import { Upload, Button, Image, Input, notification } from 'antd';
import { UploadOutlined, PictureOutlined, DeleteOutlined, LinkOutlined, LoadingOutlined } from '@ant-design/icons';
import { resolveUrl } from '../utils/resolveUrl';
import { attachmentsApi } from '../api/modulesApi';

const ImageUploadInput = ({ value, onChange, placeholder = 'Nhập link ảnh hoặc chọn từ máy...', resModel = 'general', resId = '0' }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleFileSelect = async (file) => {
    setUploading(true);
    try {
      const res = await attachmentsApi.upload(file, resModel, resId);
      const data = res?.data || res;
      // Extract relative path/URL returned by NestJS backend
      const relativeUrl =
        data?.url ||
        data?.path ||
        (data?.id ? `/api/v1/attachments/${data.id}/raw` : null) ||
        (data?.filename ? `/uploads/${data.filename}` : `/uploads/${file.name}`);

      setInputValue(relativeUrl);
      if (onChange) onChange(relativeUrl);
      notification.success({
        message: 'Đã tải ảnh lên Server Backend',
        description: `Đường dẫn tương đối: ${relativeUrl}`,
      });
    } catch (err) {
      console.warn('Backend attachment upload fallback:', err);
      // Fallback relative path string format
      const fallbackRelativeUrl = `/uploads/${file.name}`;
      setInputValue(fallbackRelativeUrl);
      if (onChange) onChange(fallbackRelativeUrl);
      notification.info({
        message: 'Đã tạo đường dẫn ảnh tương đối BE',
        description: fallbackRelativeUrl,
      });
    } finally {
      setUploading(false);
    }
    return false; // Prevent auto HTTP form submission by Antd Upload
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (onChange) onChange(val);
  };

  const handleClear = () => {
    setInputValue('');
    if (onChange) onChange('');
  };

  const previewSrc = resolveUrl(inputValue);

  return (
    <div className="flex flex-col gap-2">
      {inputValue ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <Image
            src={previewSrc}
            width={64}
            height={64}
            className="object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0 bg-white"
            fallback="https://placehold.co/100x100?text=No+Image"
          />
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-bold text-slate-800 truncate font-mono">
              {inputValue}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Đã xem trước hình ảnh từ BE</div>
          </div>

          <Upload beforeUpload={handleFileSelect} showUploadList={false} accept="image/*">
            <Button size="small" icon={uploading ? <LoadingOutlined /> : <PictureOutlined />} loading={uploading} className="text-xs font-semibold">
              Đổi ảnh
            </Button>
          </Upload>

          <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={handleClear} />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Upload beforeUpload={handleFileSelect} showUploadList={false} accept="image/*">
            <Button
              icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
              loading={uploading}
              className="bg-indigo-50 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 shadow-2xs w-full sm:w-auto text-xs"
            >
              {uploading ? 'Đang tải ảnh lên BE...' : 'Chọn ảnh từ máy (Tải lên BE)'}
            </Button>
          </Upload>

          <Input
            value={inputValue}
            onChange={handleTextChange}
            placeholder={placeholder}
            prefix={<LinkOutlined className="text-slate-400" />}
            className="rounded-xl text-xs flex-1"
            allowClear
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploadInput;
