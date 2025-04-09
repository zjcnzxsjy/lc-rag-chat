import { Upload, UploadProps } from 'antd';

const { Dragger } = Upload;

const FileUpload = (props: UploadProps) => {
  return (
    <Dragger
      {...props}
      accept=".pdf,.text,.md,.doc,.docx"
    >
      <p className="ant-upload-hint">
        上传文件
      </p>
    </Dragger>
  )
}

export default FileUpload