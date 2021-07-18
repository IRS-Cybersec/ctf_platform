import React from 'react';
import { Layout, message, Avatar, Button, Form, Input, Divider, Upload } from 'antd';
import {
    KeyOutlined,
    LockOutlined,
    UploadOutlined
} from '@ant-design/icons';
import './App.min.css';



const ChangePasswordForm = (props) => {
    const [form] = Form.useForm();

    return (
        <Form
            form={form}
            name="changePassword"
            className="change-password-form"
            onFinish={(values) => {

                fetch(window.ipAddress + "/v1/account/password", {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
                    body: JSON.stringify({
                        "password": values.oldPass,
                        "new_password": values.newPassword,
                    })
                }).then((results) => {
                    return results.json(); //return data in JSON (since its JSON data)
                }).then((data) => {
                    if (data.success === true) {
                        message.success({ content: "Password changed successfully." })
                        form.resetFields()
                    }
                    else if (data.error === "wrong-password") {
                        message.error({ content: "Old password is incorrect. Please try again." })
                    }
                    else {
                        message.error({ content: "Oops. Unknown error." })
                    }

                }).catch((error) => {
                    console.log(error)
                    message.error({ content: "Oops. There was an issue connecting with the server" });
                })
            }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", marginBottom: "2vh" }}
        >
            <h3>Old Password:</h3>
            <Form.Item
                name="oldPass"
                rules={[{ required: true, message: 'Please input your old password', }]}>

                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter your old password." />
            </Form.Item>
            <h3>New Password:</h3>
            <Form.Item
                name="newPassword"
                rules={[
                    {
                        required: true,
                        message: 'Please input your new password',
                    },
                ]}
                hasFeedback
            >

                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Enter a new password" />
            </Form.Item>

            <h3>Confirm New Password:</h3>
            <Form.Item
                name="confirm"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                    {
                        required: true,
                        message: 'Please retype your new password to confirm',
                    },
                    ({ getFieldValue }) => ({
                        validator(rule, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject('Oops, the 2 passwords do not match');
                        },
                    }),
                ]}
            >

                <Input.Password allowClear prefix={<LockOutlined />} placeholder="Confirm new password" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" icon={<KeyOutlined />}>Change Password</Button>
            </Form.Item>
        </Form>
    );
}

class Settings extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            fileList: [],
            disableUpload: false
        }
    }

    componentDidMount() {
    }


    render() {
        return (
            <Layout className="layout-style">
                <Divider />
                <div style={{ display: "flex", marginRight: "5ch", alignItems: "center", justifyItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "initial", width: "15ch", overflow: "hidden" }}>
                        <Avatar style={{ backgroundColor: "Red", width: "12ch", height: "12ch" }} size='large' src={"https://api.irscybersec.tk/uploads/profile/" + this.props.username}/>
                        <div style={{ marginTop: "2ch" }}>
                            <Upload
                                fileList={this.state.fileList}
                                disabled={this.state.disableUpload}
                                accept=".png, .jpg, .jpeg, .webp"
                                action={window.ipAddress + "/v1/profile/upload"}
                                maxCount={1}
                                onChange={(file) => {
                                    this.setState({fileList: file.fileList})
                                    if (file.file.status === "uploading") {
                                        this.setState({disableUpload: true})
                                    }
                                    else if ("response" in file.file) {
                                        if (file.file.response.success) message.success("Uploaded profile picture")
                                        else message.error("Failed to upload profile picture")
                                        this.setState({fileList: [], disableUpload: false})
                                    }
                                }}
                                headers={{ "Authorization": localStorage.getItem("IRSCTF-token") }}
                                name="profile_pic"
                                beforeUpload={file => {
                                    const exts = ["image/png", "image/jpg", "image/jpeg", "image/webp"]
                                    if (!exts.includes(file.type)) {
                                        message.error(`${file.name} is not an image file.`);
                                        return Upload.LIST_IGNORE
                                    }
                                    if (file.size > 102400) {
                                        message.error(`${file.name} is larger than 100KB.`);
                                        message.info('Please upload a smaller file')
                                        return Upload.LIST_IGNORE
                                    }
                                    return true
                                }}>
                                <Button type="primary" icon={<UploadOutlined />}>Upload</Button>
                            </Upload>
                        </div>
                    </div>
                    <h1 style={{ fontSize: "5ch", marginLeft: "1ch" }}>{this.props.username}</h1>
                </div>

                <Divider />
                <h1 className="settings-header"><KeyOutlined /> Change Password</h1>
                <div className="form-style">
                    <ChangePasswordForm />
                </div>

                <Divider />
            </Layout>
        )
    }
}




export default Settings;
