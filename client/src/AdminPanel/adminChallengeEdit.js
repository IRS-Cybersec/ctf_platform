import React, { Suspense, useEffect } from 'react';
import { Tooltip, Layout, Divider, Modal, message, InputNumber, Button, Select, Space, Form, Input, Tabs, Tag, Switch, Card, Cascader } from 'antd';
import {
    MinusCircleOutlined,
    PlusOutlined,
    LeftOutlined,
    ProfileOutlined,
    FlagOutlined,
    EditTwoTone,
    SolutionOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons';
import { Ellipsis } from 'react-spinners-css';
const MDEditor = React.lazy(() => import("@uiw/react-md-editor"));
const MarkdownRender = React.lazy(() => import('./../Misc/MarkdownRenderer.js'));
import { Prompt } from 'react-router-dom';


const { Option } = Select;
const { TabPane } = Tabs;


const CreateChallengeForm = (props) => {
    const [form] = Form.useForm();
    const [editorValue, setEditorValue] = React.useState("")
    const [existingCats, setExistingCats] = React.useState([])
    const [finalSortedChalls, setFinalSortedChalls] = React.useState([])

    //Render existing categories select options

    useEffect(() => {
        let existingCats = []
        for (let i = 0; i < props.allCat.length; i++) {
            existingCats.push(<Option key={props.allCat[i].key} value={props.allCat[i].key}>{props.allCat[i].key}</Option>)
        }
        //Render existing challenges select options minus the challenge itself
        let existingChalls = {}
        for (let i = 0; i < props.challenges.length; i++) {
            if (props.challenges[i].name !== props.initialData.name) {
                if (!(props.challenges[i].category in existingChalls)) existingChalls[props.challenges[i].category] = []
                existingChalls[props.challenges[i].category].push({
                    value: props.challenges[i]._id,
                    label: props.challenges[i].name
                })
            }
        }
        setExistingCats(existingCats)
        let finalSortedChalls = []
        for (const category in existingChalls) {
            finalSortedChalls.push({
                value: category,
                label: category,
                children: existingChalls[category]
            })
        }
        setFinalSortedChalls(finalSortedChalls)
        let initialData = JSON.parse(JSON.stringify(props.initialData))

        if (props.initialData.visibility === false) {
            initialData.visibility = "false"
        }
        else if (props.initialData.visibility === true) {
            initialData.visibility = "true"
        }
        // if we put only props.initialData.requires, we are merely putting a reference to props.initialData.requires, which is this array, creating a "loop"

        if (props.initialData.requires) initialData.requires = [props.IDNameMapping[props.initialData.requires], props.initialData.requires]
        if (props.initialData.dynamic === false) {
            initialData.dynamic = "false"
        }
        else if (props.initialData.dynamic === true) {
            initialData.dynamic = "true"
            props.setState({ dynamic: true })
        }
        else {
            initialData.dynamic = "false"
        }
        initialData.category1 = initialData.category
        form.setFieldsValue(initialData)
        setEditorValue(initialData.description)
    }, [])

    return (
        <Form
            form={form}
            name="create_challenge_form"
            className="create_challenge_form"
            onValuesChange={() => { if (props.state.edited === false) props.setState({ edited: true }) }}
            onFinish={async (values) => {
                props.setState({ edited: false })
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
                    if (values.dynamic === "false") {
                        values.dynamic = false
                    }
                    else {
                        values.dynamic = true
                    }
                    if (typeof values.writeup !== "undefined") {
                        if (typeof values.writeupComplete === "undefined") {
                            values.writeupComplete = true
                        }
                    }
                    const category = (typeof values.category1 !== "undefined") ? values.category1 : values.category2
                    props.setState({ editLoading: true })
                    let requires = ""
                    if (values.requires && values.requires.length > 0) requires = values.requires[1]
                    await fetch(window.ipAddress + "/v1/challenge/edit", {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken },
                        body: JSON.stringify({
                            "id": props.initialData._id,
                            "name": values.name,
                            "category": category,
                            "description": values.description,
                            "points": values.points,
                            "flags": values.flags,
                            "tags": values.tags,
                            "hints": values.hints,
                            "max_attempts": values.max_attempts,
                            "visibility": values.visibility,
                            "writeup": values.writeup,
                            "writeupComplete": values.writeupComplete,
                            "requires": requires,
                            "dynamic": values.dynamic,
                            "initial": values.initial,
                            "minSolves": values.minSolves,
                            "minimum": values.minimum
                        })
                    }).then((results) => {
                        return results.json(); //return data in JSON (since its JSON data)
                    }).then((data) => {
                        if (data.success === true) {
                            message.success({ content: "Edited challenge \"" + props.initialData.name + "\" successfully!" })
                            props.handleEditChallBack()
                            setEditorValue("")
                            form.resetFields()
                        }
                        else if (data.error === "exists") {
                            message.warn("A challenge with an existing name exists")
                        }
                        else {
                            message.error({ content: "Oops. Unknown error" })
                        }


                    }).catch((error) => {
                        console.log(error)
                        message.error({ content: "Oops. There was an issue connecting with the server" });
                    })
                    props.setState({ editLoading: false })

                }

            }}
        >
            <Prompt
                when={props.state.edited}
                message='The challenge details you modified have not been saved. Are you sure you want to leave?'
            />
            <p><b><u>ID:</u></b> <code>{props.initialData._id}</code></p>


            <h1>Challenge Name:</h1>
            <Form.Item
                name="name"
                rules={[{ required: true, message: 'Please enter a challenge name' }]}
            >

                <Input allowClear placeholder="Challenge name" />
            </Form.Item>


            <Divider />
            <h1>Challenge Category:</h1>
            <h4>Select an Existing Category: </h4>
            <Form.Item
                name="category1"
                initialValue={""}
                rules={[{ required: !props.state.selectCatDisabled, message: 'Please enter a challenge category' }]}
            >

                <Select
                    disabled={props.state.selectCatDisabled}
                    allowClear
                    showSearch
                    placeholder="Select an existing Category"
                    onChange={(value) => {
                        if (value) {
                            props.setState({ inputCatDisabled: true })
                        }
                        else {
                            props.setState({ inputCatDisabled: false })
                        }
                    }}
                >
                    {existingCats}
                </Select>

            </Form.Item>
            <h4>Enter a New Category</h4>
            <Form.Item
                name="category2"
                rules={[{ required: !props.state.inputCatDisabled, message: 'Please enter a challenge category' }]}
            >

                <Input onChange={(e) => {
                    e.target.value.length > 0 ? props.setState({ selectCatDisabled: true }) : props.setState({ selectCatDisabled: false })
                }} disabled={props.state.inputCatDisabled} allowClear placeholder="Enter a new challenge category" />
            </Form.Item>

            <Divider />

            <h1>Challenge Description (Supports <a href="https://guides.github.com/features/mastering-markdown/" target="_blank" rel="noreferrer">Markdown</a> and <a href="https://github.com/rehypejs/rehype-raw" target="_blank" rel="noreferrer">HTML</a>)):</h1>
            <Suspense fallback={<div style={{ height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 15 }}>
                <Ellipsis color="#177ddc" size={120} ></Ellipsis>
            </div>}>
                <Form.Item
                    name="description"
                    rules={[{ required: true, message: 'Please enter a description' }]}
                    valuePropName={editorValue}
                >
                    <MDEditor value={editorValue} onChange={(value) => { setEditorValue(value) }} preview="edit" />
                </Form.Item>

                <h3>Challenge Description Preview</h3>
                <Card
                    type="inner"
                    bordered={true}
                    bodyStyle={{ backgroundColor: "#262626", textAlign: "center" }}
                    className="challengeModal"
                >
                    <MarkdownRender>{editorValue}</MarkdownRender>
                </Card>
            </Suspense>


            <Divider />

            <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center" }}>

                    <Card className="settings-card">
                        <h1>Challenge Points:</h1>
                        <Form.Item
                            name="points"
                            rules={[{ required: true, message: 'Please enter challenge points' }, {
                                type: 'integer',
                                message: "Please enter a valid integer between 0-100000",
                            },]}
                            initialValue={0}
                        >

                            <InputNumber disabled={props.state.dynamic} min={0} max={100000} style={{ width: "30ch" }} ></InputNumber>
                        </Form.Item>
                    </Card>

                    <Card className="settings-card">
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
                    </Card>
                </div>

                <Divider type="vertical" style={{ height: "inherit" }}></Divider>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Form.List name="flags" >
                        {(fields, { add, remove }) => {

                            return (
                                <Card className="settings-card">
                                    <h1>Flags</h1>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                            <Form.Item
                                                {...field}
                                                name={[field.name]}
                                                fieldKey={[field.fieldKey]}
                                                rules={[{ required: true, message: 'Missing flag' }, { message: "Please enter a flag that is < 1000 characters", pattern: /^.{1,1000}$/ }]}
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


                                </Card>
                            );
                        }}
                    </Form.List>

                    <Form.List name="tags">
                        {(fields, { add, remove }) => {
                            return (
                                <Card className="settings-card">
                                    <h1>Tags</h1>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                            <Form.Item
                                                {...field}
                                                name={[field.name]}
                                                fieldKey={[field.fieldKey]}
                                                rules={[{ required: true, message: 'Missing tag' }]}
                                            >
                                                <Input placeholder="Tag" style={{ width: "50ch" }} />
                                            </Form.Item>


                                            <MinusCircleOutlined
                                                className="dynamic-delete-button"
                                                style={{ margin: '0 8px', color: "red" }}
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
                                </Card>
                            );
                        }}
                    </Form.List>
                </div>
            </div>

            <Divider />
            <div className="settings-responsive2" style={{ display: "flex", justifyContent: "space-around" }}>

                <div style={{ display: "flex", flexDirection: "column" }}>

                    <Form.List name="hints" >
                        {(fields, { add, remove }) => {
                            return (
                                <Card className="settings-card">
                                    <h1>Hints</h1>
                                    {fields.map(field => (
                                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "hint"]}
                                                fieldKey={[field.fieldKey, "hint"]}
                                                rules={[{ required: true, message: 'Missing hint' }]}
                                            >
                                                <Input placeholder="Hint" style={{ width: "20vw" }} />
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
                                                <InputNumber min={0} max={10000} placeholder="Cost"></InputNumber>
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
                                </Card>
                            );
                        }}
                    </Form.List>

                    <Card className="settings-card">
                        <h1>Writeup Link (Optional)</h1>
                        <Form.Item
                            name="writeup"
                            rules={[
                                {
                                    type: 'url',
                                    message: "Please enter a valid link",
                                }]}
                        >

                            <Input allowClear style={{ width: "50ch" }} placeholder="Enter a writeup link for this challenge" />
                        </Form.Item>
                        <div style={{ display: "flex", alignContent: "center" }}>
                            <h4 style={{ marginRight: "2ch" }}>Release Writeup Only After Completion: </h4>
                            <Form.Item
                                name="writeupComplete"
                            >
                                <Switch defaultChecked />
                            </Form.Item>
                        </div>
                    </Card>

                    <Card className="settings-card">
                        <h1>Visibility</h1>
                        <Form.Item
                            name="visibility"
                            rules={[{ required: true, message: 'Please set the challenge visibility' }]}
                            initialValue="false"
                        >
                            <Select style={{ width: "20ch" }}>
                                <Option value="false"><span style={{ color: "#d32029" }}>Hidden <EyeInvisibleOutlined /></span></Option>
                                <Option value="true"><span style={{ color: "#49aa19" }}>Visible <EyeOutlined /></span></Option>
                            </Select>

                        </Form.Item>
                    </Card>

                </div>

                <Divider type="vertical" style={{ height: "inherit" }} />


                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Card>
                        <h1>Challenge Required: </h1>
                        <Form.Item
                            name="requires"
                        >
                            {/*
                        The issue with this is that displayRender is supposed to return an array, 
                        but setting a value causes it to become a string and error out
                        */}
                            <Cascader
                                options={finalSortedChalls}
                                allowClear
                                showSearch
                                placeholder="Select an existing challenge" />

                        </Form.Item>
                        <p>Locks this challenge until the provided challenge above has been solved.</p>
                    </Card>

                    <Card className="settings-card">
                        <h1>Dynamic Scoring</h1>
                        <Form.Item
                            name="dynamic"
                            rules={[{ required: props.state.dynamic, message: 'Please set whether the challenge uses dynamic scoring' }]}
                            initialValue="false"
                        >
                            <Select style={{ width: "20ch" }} onSelect={(option) => { option === "false" ? props.setState({ dynamic: false }) : props.setState({ dynamic: true }) }}>
                                <Option value="false"><span style={{ color: "#d32029" }}>Disabled</span></Option>
                                <Option value="true"><span style={{ color: "#49aa19" }}>Enabled</span></Option>
                            </Select>

                        </Form.Item>

                        <h1>Initial Points:</h1>
                        <Form.Item
                            name="initial"
                            rules={[{ required: props.state.dynamic, message: 'Please enter the initial challenge points' }, {
                                type: 'integer',
                                message: "Please enter a valid integer between 1-100000",
                            },]}
                            initialValue={500}
                        >
                            <InputNumber disabled={!props.state.dynamic} min={1} max={100000} ></InputNumber>
                        </Form.Item>
                        <p>Initial number of points when there are 0/1 solves on a challenge</p>

                        <h1>Minimum Points:</h1>
                        <Form.Item
                            name="minimum"
                            rules={[{ required: props.state.dynamic, message: 'Please enter the minimum challenge points' }, {
                                type: 'integer',
                                message: "Please enter a valid integer between 0-100000",
                            },]}
                            initialValue={100}
                        >
                            <InputNumber disabled={!props.state.dynamic} min={0} max={100000} ></InputNumber>
                        </Form.Item>
                        <p>Minimum amount of points that the challenge can decay too</p>

                        <h1>Solves to Minimum:</h1>
                        <Form.Item
                            name="minSolves"
                            rules={[{ required: props.state.dynamic, message: 'Please enter the solves to minimum' }, {
                                type: 'integer',
                                message: "Please enter a valid integer between 1-100000",
                            },]}
                            initialValue={50}
                        >
                            <InputNumber disabled={!props.state.dynamic} min={1} max={100000} ></InputNumber>
                        </Form.Item>
                        <p>Number of solves on the challenge till it decays to the minimum point.</p>
                    </Card>
                </div>
            </div>

            <Form.Item>
                <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row", marginTop: "3ch" }}>
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
            oldChallengeName: "",
            selectCatDisabled: false,
            inputCatDisabled: true,
            challengeWriteup: "",
            edited: false
        }
    }

    componentDidUpdate = () => {
        if (this.state.edited) {
            window.onbeforeunload = () => { }
        }
    }

    componentDidMount() {
        this.getChallengeDetails(this.props.id)
        this.setState({ oldChallengeName: this.props.challengeName })
    }

    getChallengeDetails = (id) => {
        this.setState({ loading: true })
        fetch(window.ipAddress + "/v1/challenge/show/" + encodeURIComponent(id) + "/detailed", {
            method: 'get',
            headers: { 'Content-Type': 'application/json', "Authorization": window.IRSCTFToken }
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
            console.log(error)
            message.error({ content: "Oops. There was an issue connecting with the server" });
        })
    }

    previewChallenge = (values) => {

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

        //Render writeup link
        let writeupLink = ""
        if (typeof values.writeup !== "undefined") {
            writeupLink = values.writeup
        }
        else writeupLink = ""

        this.setState({ previewData: values, previewModal: true, challengeTags: renderTags, challengeHints: renderHints, challengeWriteup: writeupLink })
    }

    render() {
        return (

            <Layout className="form-style">
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
                            {this.state.challengeWriteup !== "" && (
                                <Tooltip title="View writeups for this challenge">
                                    <Button shape="circle" size="large" style={{ position: "absolute", right: "2ch" }} type="primary" icon={<SolutionOutlined />} onClick={() => { window.open(this.state.challengeWriteup) }} />
                                </Tooltip>
                            )}
                            {this.state.challengeWriteup === "" && (
                                <Tooltip title="Writeups are not available for this challenge">
                                    <Button disabled shape="circle" size="large" style={{ position: "absolute", right: "2ch" }} type="primary" icon={<SolutionOutlined />} />
                                </Tooltip>
                            )}
                            <h1 style={{ fontSize: "150%" }}>{this.state.previewData.name}</h1>
                            <div>
                                {this.state.challengeTags}
                            </div>
                            <h2 style={{ color: "#1765ad", marginTop: "2vh", marginBottom: "2vh", fontSize: "200%" }}>{this.state.previewData.points}</h2>

                            <div className="challengeModal">
                                <MarkdownRender>{this.state.previewData.description}</MarkdownRender>
                            </div>


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
                    <CreateChallengeForm IDNameMapping={this.props.IDNameMapping} allCat={this.props.allCat} challenges={this.props.challenges} state={this.state} editLoading={this.state.editLoading} setState={this.setState.bind(this)} previewChallenge={this.previewChallenge.bind(this)} initialData={this.state.challengeData} handleEditChallBack={this.props.handleEditChallBack}></CreateChallengeForm>
                )}

                {this.state.loading && (
                    <div>
                        <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                            <Ellipsis color="#177ddc" size={120} ></Ellipsis>
                        </div>
                    </div>
                )}
            </Layout>
        );
    }
}

export default AdminChallengeEdit;