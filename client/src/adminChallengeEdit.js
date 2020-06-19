import React from 'react';
import { Layout, Divider, Modal, message, InputNumber, Button, Select, Space, Form, Input, Tabs, Tag } from 'antd';
import {
    MinusCircleOutlined,
    PlusOutlined,
    LeftOutlined,
    ProfileOutlined,
    FlagOutlined,
    EditTwoTone,
    LoadingOutlined
} from '@ant-design/icons';
import './App.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JsxParser from 'react-jsx-parser'


const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;


const CreateChallengeForm = (props) => {
    const [form] = Form.useForm();

    if (typeof form.getFieldValue("flags") === "undefined") {
        if (props.initialData.visibility === false) {
            props.initialData.visibility = "false"
        }
        else {
            props.initialData.visibility = "true"
        }
        form.setFieldsValue(props.initialData)
    }

    return (
        <Form
            form={form}
            name="create_challenge_form"
            className="create_challenge_form"
            onFinish={(values) => {
                if (typeof values.flags === "undefined") {
                    message.warn("Please enter at least 1 flag")
                }
                else {
                    if (values.visibility === "false") {
                        values.visibility = false
                    }
                    else {
                        values.visibility = true
                    }
                    props.setState({ editLoading: true })
                    fetch("https://api.irscybersec.tk/v1/challenge/edit", {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
                        body: JSON.stringify({
                            "chall": props.initialData.name,
                            "name": values.name,
                            "category": values.category,
                            "description": values.description,
                            "points": values.points,
                            "flags": values.flags,
                            "tags": values.tags,
                            "hints": values.hints,
                            "max_attempts": values.max_attempts,
                            "visibility": values.visibility
                        })
                    }).then((results) => {
                        return results.json(); //return data in JSON (since its JSON data)
                    }).then((data) => {
                        //console.log(data)
                        if (data.success === true) {
                            message.success({ content: "Edited challenge \"" + props.initialData.name + "\" successfully!" })
                            props.setState({ editLoading: false })
                            props.handleEditChallBack()
                            form.resetFields()
                        }
                        else {
                            message.error({ content: "Oops. Unknown error" })
                        }


                    }).catch((error) => {
                        console.log(error)
                        message.error({ content: "Oops. There was an issue connecting with the server" });
                    })
                    
                }

            }}
        >
            <h1>Challenge Name:</h1>
            <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter a challenge name' }]}
            >

                <Input allowClear placeholder="Challenge name" />
            </Form.Item>

            <h1>Challenge Category:</h1>
            <Form.Item
                name="category"
                rules={[{ required: true, message: 'Please enter a challenge description' }]}
            >

                <Input allowClear placeholder="Enter a challenge description" />
            </Form.Item>

            <h1>Challenge Description (JSX Supported):</h1>
            <Form.Item
                name="description"
                rules={[{ required: true, message: 'Please enter a category' }]}
            >

                <TextArea rows={5} allowClear placeholder="Enter a challenge description. JSX is very similiar to HTML, only difference being that there MUST be closing tags for everything." />
            </Form.Item>

            <div style={{ display: "flex", flexDirection: "row", justifyItems: "space-evenly" }}>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", width: "35vw" }}>
                    <h1>Challenge Points:</h1>
                    <Form.Item
                        name="points"
                        rules={[{ required: true, message: 'Please enter challenge points' }, {
                            type: 'integer',
                            message: "Please enter a valid integer between 1-100000",
                        },]}
                        initialValue={0}
                    >

                        <InputNumber min={1} max={100000} style={{ width: "30ch" }} ></InputNumber>
                    </Form.Item>

                    <h1>Maximum Number of Attempts (Set to 0 for unlimited)</h1>
                    <Form.Item
                        name="max_attempts"
                        rules={[{ required: true, message: 'Please enter the maximum number of attempts' }, {
                            type: 'integer',
                            message: "Please enter a valid integer between 0-10000",
                        },]}
                        style={{ alignText: 'center' }}
                        initialValue={0}
                    >

                        <InputNumber min={0} max={10000} style={{ width: "30ch" }}></InputNumber>
                    </Form.Item>
                </div>

                <Divider type="vertical" style={{ height: "inherit" }}></Divider>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", justifyItems: "center", marginLeft: "10vw", width: "35vw" }}>
                    <Form.List name="flags" >
                        {(fields, { add, remove }) => {

                            return (
                                <div>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                            <Form.Item
                                                {...field}
                                                name={[field.name]}
                                                fieldKey={[field.fieldKey]}
                                                rules={[{ required: true, message: 'Missing flag' }]}
                                            >
                                                <Input style={{ width: "50ch" }} placeholder="Flag" />
                                            </Form.Item>

                                            {fields.length > 1 ? (
                                                <MinusCircleOutlined
                                                    className="dynamic-delete-button"
                                                    style={{ margin: '0 8px', color: "red" }}
                                                    onClick={() => {
                                                        remove(field.name);
                                                    }}
                                                />
                                            ) : null}
                                        </Space>
                                    ))}

                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onLoad={() => { if (fields.length < 1) add() }}
                                            onClick={() => {
                                                add();
                                            }}
                                            block
                                            style={{ width: "50ch" }}
                                        >
                                            <PlusOutlined /> Add Flag
                </Button>
                                    </Form.Item>


                                </div>
                            );
                        }}
                    </Form.List>

                    <Form.List name="tags">
                        {(fields, { add, remove }) => {
                            return (
                                <div>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name]}
                                                fieldKey={[field.fieldKey]}
                                                rules={[{ required: true, message: 'Missing tag' }]}
                                            >
                                                <Input placeholder="Tag" style={{ width: "50ch" }} />
                                            </Form.Item>


                                            <MinusCircleOutlined
                                                style={{ color: "red" }}
                                                onClick={() => {
                                                    remove(field.name);
                                                }}
                                            />
                                        </Space>
                                    ))}

                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => {
                                                add();
                                            }}
                                            block
                                            style={{ width: "50ch" }}
                                        >
                                            <PlusOutlined /> Add Tag
                </Button>
                                    </Form.Item>
                                </div>
                            );
                        }}
                    </Form.List>
                </div>
            </div>

            <h1>Hints</h1>
            <Form.List name="hints" >
                {(fields, { add, remove }) => {
                    return (
                        <div>
                            {fields.map(field => (
                                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                    <Form.Item
                                        {...field}
                                        name={[field.name, "hint"]}
                                        fieldKey={[field.fieldKey, "hint"]}
                                        rules={[{ required: true, message: 'Missing hint' }]}
                                    >
                                        <Input placeholder="Hint" style={{ width: "50ch" }} />
                                    </Form.Item>

                                    <Form.Item
                                        {...field}
                                        name={[field.name, "cost"]}
                                        fieldKey={[field.fieldKey, "cost"]}
                                        rules={[{ required: true, message: 'Missing cost for hint' }, {
                                            type: 'integer',
                                            message: "Please enter a valid integer between 0-10000",
                                        },]}
                                    >
                                        <InputNumber min={0} max={10000} style={{ width: "40ch" }} placeholder="Cost"></InputNumber>
                                    </Form.Item>

                                    <MinusCircleOutlined
                                        style={{ color: "red" }}
                                        onClick={() => {
                                            remove(field.name);
                                        }}
                                    />
                                </Space>
                            ))}

                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => {
                                        add();
                                    }}
                                    block
                                    style={{ width: "50ch" }}
                                >
                                    <PlusOutlined /> Add Hint
                </Button>
                            </Form.Item>
                        </div>
                    );
                }}
            </Form.List>

            <h1>Visibility</h1>
            <Form.Item
                name="visibility"
                rules={[{ required: true, message: 'Please set the challenge visibility' }]}
                initialValue={"false"}
            >
                <Select style={{ width: "10vw" }}>
                    <Option value="false">Hidden</Option>
                    <Option value="true">Visible</Option>
                </Select>

            </Form.Item>

            <Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row" }}>
                    <div>
                        <Button style={{ marginBottom: "1.5vh", marginRight: "2vw", backgroundColor: "#d4b106", borderColor: "", color: "white" }} onClick={() => { props.previewChallenge(form.getFieldsValue()) }}>Preview</Button>
                        <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginBottom: "1.5vh" }} loading={props.editLoading}>Edit Challenge</Button>
                    </div>
                    <div>
                        <Button style={{ marginRight: "2vw" }} type="primary" danger onClick={() => { form.resetFields() }}>Clear</Button>
                    </div>
                </div>
            </Form.Item>

        </Form>
    );
};


class AdminChallengeEdit extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            editLoading: false,
            challengeData: {
                name: "",
                category: this.props.category,
                description: "",
                points: 0,
                author: "",
                created: "",
                solves: [],
                max_attempts: 0,
                tags: [],
                hints: [],
            },
            previewData: {
                name: "",
                category: this.props.category,
                description: "",
                points: 0,
                author: "",
                created: "",
                solves: [],
                max_attempts: 0,
                tags: [],
                hints: [],
            },
            challengeTags: [],
            previewModal: false,
            oldChallengeName: ""
        }
    }

    componentDidMount() {
        this.getChallengeDetails(this.props.challengeName)
        this.setState({ oldChallengeName: this.props.challengeName })
    }

    getChallengeDetails = (name) => {
        this.setState({ loading: true })
        fetch("https://api.irscybersec.tk/v1/challenge/show/" + name + "/detailed", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        }).then((results) => {
            return results.json(); //return data in JSON (since its JSON data)
        }).then((data) => {
            //console.log(data)
            if (data.success === true) {
                this.setState({ challengeData: data.chall })
            }
            else {
                message.error({ content: "Oops. Unknown error" })
            }

            this.setState({ loading: false })


        }).catch((error) => {
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    previewChallenge = (values) => {

        //Replace <code> with syntax highlighter
        let description = values.description
        let position = description.search("<code>")


        if (position !== -1) {

            let language = ""
            let offset = 0
            position += 6

            while (true) {
                let currentLetter = description.slice(position + offset, position + offset + 1)
                if (currentLetter === "\n") {
                    language = description.slice(position, position + offset)
                    description = description.slice(0, position) + description.slice(position + offset)
                    description = description.replace("<code>", "<SyntaxHighlighter language='" + language + "' style={atomDark}>{'")
                    description = description.replace("</code>", "'}</SyntaxHighlighter>")
                    values.description = description
                    break
                }
                else if (offset > 10) {
                    break
                }
                offset += 1
            }


        }

        if (values.max_attempts === 0) {
            values.max_attempts = "Unlimited"
        }
        else {
            values.max_attempts = String(values.max_attempts) + "/" + String(values.max_attempts)
        }

        var renderTags = []
        if (typeof values.tags !== "undefined") {
            const tag = values.tags

            for (let x = 0; x < tag.length; x++) {
                renderTags.push(
                    <Tag color="#1765ad">
                        {tag[x]}
                    </Tag>
                )
            }

        }

        //Handle hints
        if (typeof values.hints !== "undefined") {
            const hints = values.hints
            var renderHints = []

            for (let x = 0; x < hints.length; x++) {
                renderHints.push(
                    <Button type="primary" key={hints[x].cost} style={{ marginBottom: "1.5vh" }}>Hint {x + 1} - {hints[x].cost} Points</Button>
                )
            }

        }

        this.setState({ previewData: values, previewModal: true, challengeTags: renderTags, challengeHints: renderHints })
    }
    
    render() {
        return (

            <Layout style={{ height: "100%", width: "100%", margin: "10px" }}>
                <Modal
                    title={null}
                    visible={this.state.previewModal}
                    footer={null}
                    bodyStyle={{ textAlign: "center" }}
                    onCancel={() => { this.setState({ previewModal: false }) }}
                >
                    <Tabs defaultActiveKey="challenge">
                        <TabPane
                            tab={<span><ProfileOutlined /> Challenge</span>}
                            key="challenge"
                        >
                            <h1 style={{ fontSize: "150%" }}>{this.state.previewData.name}</h1>
                            <div>
                                {this.state.challengeTags}
                            </div>
                            <h2 style={{ color: "#1765ad", marginTop: "2vh", marginBottom: "2vh", fontSize: "200%" }}>{this.state.previewData.points}</h2>
                            <JsxParser
                                bindings={{
                                    atomDark: atomDark
                                }}
                                components={{ SyntaxHighlighter }}
                                jsx={this.state.previewData.description}
                            />


                            <div style={{ marginTop: "6vh", display: "flex", flexDirection: "column" }}>
                                {this.state.challengeHints}
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <Input style={{ width: "45ch" }} defaultValue="" placeholder={"Enter a flag"} />
                                <Button type="primary" icon={<FlagOutlined />}>Submit</Button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginTop: "2vh" }}>
                                <p>Challenge Author: {this.state.challengeData.author}</p>
                                <p style={{ color: "#d87a16", fontWeight: 500 }}>Attempts Remaining: {this.state.previewData.max_attempts}</p>
                            </div>
                        </TabPane>
                    </Tabs>


                </Modal>
                <div style={{ display: "flex", alignItems: "center", alignContent: "center" }}>
                    <Button type="primary" onClick={this.props.handleEditBack} icon={<LeftOutlined />} style={{ maxWidth: "20ch", marginBottom: "3vh", marginRight: "2vw" }}>Back</Button>
                    <h1 style={{ fontSize: "180%" }}> <EditTwoTone /> Edit Challenge</h1>

                </div>
                {!this.state.loading && (
                    <CreateChallengeForm editLoading={this.state.editLoading} setState={this.setState.bind(this)} previewChallenge={this.previewChallenge.bind(this)} initialData={this.state.challengeData} handleEditChallBack={this.props.handleEditChallBack}></CreateChallengeForm>
                )}

                {this.state.loading && (
                    <div>
                        <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <LoadingOutlined style={{ color: "#177ddc", fontSize: "600%", position: "absolute", zIndex: 1 }} />
                        </div>
                    </div>
                )}
            </Layout>
        );
    }
}

export default AdminChallengeEdit;