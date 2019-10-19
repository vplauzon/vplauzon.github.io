---
title:  AKS Auto Scaler with ARM Template
date:  2019-03-20 06:30:16 -04:00
permalink:  "/2019/03/20/aks-auto-scaler-with-arm-template/"
categories:
- Solution
tags:
- Containers
---
<img style="float:left;padding-right:20px;" title="From pixabay.com" src="https://vincentlauzon.files.wordpress.com/2019/03/scaling.png" />

<a href="https://vincentlauzon.com/?s=aks">Azure Kubernetes Service</a> (AKS) Auto Scaler is finally out there in public preview!

The <a href="https://docs.microsoft.com/en-us/azure/aks/cluster-autoscaler">online documentation</a> does a great job of getting us started.  In this article I wanted to get it a little further with two things.  First by showing how to use ARM templates to deploy an AKS Cluster with Auto Scaler on.  Second by kicking the autoscaler on with a simple deployment.

Auto scaling is useful to size an AKS cluster on demand.  Scenarios for this range from seasonal change to daily change to simply having a cluster that has variable workloads running on it.

It goes without saying:  the <a href="https://github.com/vplauzon/aks/tree/master/aks-auto-scaler">code is on GitHub</a>.

<h2>Scaling</h2>

There always is a little confusion about auto scaling in the cloud, so let's clear that confusion.

There are two ways of scaling:  by pods and by nodes.  The former is referred to <a href="https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/">horizontal pod autoscaler</a> and is native to Kubernetes' platform.  The latter is specific to Cloud Providers.

<a href="https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/">Horizontal pod autoscaler</a> is a Kubernetes controller (like replica set or deployment).  Instead of having a fixed replica count, that one varies given a metric (e.g. CPU utilization).  When the pods get too "hot", the autoscaler increases the number of pods.  When the pods get too "cold", it decreases the number of pods.

Increasing the number of pods in a fixed cluster has limitation of course since the compute is fixed.  This is where something like Azure Auto Scaler comes in.  This increases or decreases the number of nodes depending on demand.  Instead of monitoring a metric, it simply looks at the pending queue of pods that can't be scheduled on the cluster.

<h2>Preview registration</h2>

At the time of this writing (March 2019), Auto Scaler is in Public Preview.  Before we can deploy auto scaler on AKS, we need to enable a feature flag on our subscription.

The <a href="https://docs.microsoft.com/en-us/azure/aks/cluster-autoscaler#register-scale-set-feature-provider">online documentation</a> explains the steps.

<h2>ARM template</h2>

The following button allows us to deploy our cluster:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Faks%2Fmaster%2Faks-auto-scaler%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy button" /></a>

This deployment is based on <a href="https://vincentlauzon.com/2018/09/06/aks-with-kubenet-vs-azure-networking-plug-in/">our article on Kubenet networking plugin</a>.  As such, it deploys the cluster within a custom Virtual Network while using Kubenet (as opposed to Azure CNI).  As we'll see, we could easily alter any deployment to accommodate the auto scaler, but this was the base configuration.

The template deploys a cluster with Kubernetes (orchestrator) version 1.12.6.  This might be obsolete in the near future and make the template obsolete.  A simple change of that version would fix the template.

As such we need to input the following parameters:

<table>
<thead>
<tr>
  <th>Parameter Name</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>DNS Prefix</td>
  <td>Domain name for the cluster ; this needs to be unique within a region</td>
</tr>
<tr>
  <td>Service Principal App ID</td>
  <td>Application ID of the service principal of the cluster</td>
</tr>
<tr>
  <td>Service Principal Object ID</td>
  <td>Object ID of the same principal ; this is used for a role assignment to give that principal privilege to alter the virtual network</td>
</tr>
<tr>
  <td>Service Principal Secret</td>
  <td>Secret of the service principal</td>
</tr>
</tbody>
</table>

The <a href="https://github.com/vplauzon/aks/blob/master/aks-auto-scaler/deploy.json">ARM template is on GitHub</a>.  The key section is the following:

```Javascript
{
    "type": "Microsoft.ContainerService/managedClusters",
    "name": "cluster",
    "apiVersion": "2018-08-01-preview",
    "location": "[resourceGroup().location]",
    "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNET Name'))]"
    ],
    "properties": {
        ...
        "agentPoolProfiles": [
            {
                "name": "agentpool",
                "count": "[variables('instance count')]",
                "vmSize": "[variables('VM Size')]",
                "vnetSubnetID": "[resourceId('Microsoft.Network/virtualNetworks/subnets', variables('VNET Name'), 'aks')]",
                "maxPods": 30,
                "osType": "Linux",
                "storageProfile": "ManagedDisks",
                "enableAutoScaling": true,
                "minCount": 1,
                "maxCount": 5,
                "type": "VirtualMachineScaleSets"
            }
        ],
```

Key elements are:

<table>
<thead>
<tr>
  <th>Line #</th>
  <th>Content</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>4</td>
  <td><code>"apiVersion": "2018-08-01-preview"</code></td>
  <td>This refers to a preview API ; if we don't use this, the following elements won't be understood by the ARM provider.</td>
</tr>
<tr>
  <td>14</td>
  <td><code>"count": "[variables('instance count')]"</code></td>
  <td>This isn't a new configuration.  This usually refer to the static size of the cluster.  Here it refers to the "starting size".</td>
</tr>
<tr>
  <td>22</td>
  <td><code>"minCount": 1</code></td>
  <td>This is the minimum size of the cluster.  The autoscaler won't decrease the number of nodes further once this size is attained.</td>
</tr>
<tr>
  <td>23</td>
  <td><code>"maxCount": 5</code></td>
  <td>Similar but for the maximum size.</td>
</tr>
<tr>
  <td>24</td>
  <td><code>"type": "VirtualMachineScaleSets"</code></td>
  <td>This is required.</td>
</tr>
</tbody>
</table>

The last element, i.e. <code>"type": "VirtualMachineScaleSets"</code>, is a key change in AKS architecture enabling auto scaling.  So far, AKS has been implemented with Virtual Machines.  This new feature allows AKS to be implemented with an <a href="https://docs.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview">Azure VM Scale Set</a>.

A scale set allows VM to be managed as a "set".  The number of VMs is simply a parameter of the set.  Understandably, it is easier to implement auto scaling in AKS with a VM Scale Set than VMs.

<h2>Looking at managed resource group</h2>

If we look at the corresponding managed resource group (named <code>MC___</code>), we can see a VM Scale Set present:

<img src="https://vincentlauzon.files.wordpress.com/2019/03/scaleset-1.png" alt="Resources in managed resource group" />

If we "open" the VM Scale Set, we can see it currently has 3 instances.

<img src="https://vincentlauzon.files.wordpress.com/2019/03/scaleset-overview.png" alt="VM Scale Set overview" />

We could also go to the <em>Scaling</em> pane and see the scaling history.  This is where we go to change the number of instances of a scale set but in our case, we let AKS handle it.

<h2>Kicking the auto scaler</h2>

Now, let's <em>test</em> the auto scaler.

We are going to do this by deploying a <a href="https://github.com/vplauzon/aks/blob/master/aks-auto-scaler/deployment.yaml">Kubernetes deployment with 20 replicas</a>.

In order to force Kubernetes to run out of resources, we configured our pods to request more memory than they need.  This is done at lines 20-26:

```Javascript
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-deploy
  labels:
    app: demo-app
spec:
  replicas: 20
  selector:
    matchLabels:
      app: demo-app
  template:
      metadata:
        labels:
          app: demo-app
      spec:
        containers:
        - name: myapi
          image: vplauzon/get-started:part2-no-redis
          resources:
            requests:
              memory: "1.5G"
              cpu: "250m"
            limits:
              memory: "2G"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
          ports:
          - containerPort: 80
```

We can deploy it using the command line:

```bash
kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/aks-auto-scaler/deployment.yaml
```

We can then check on the status of the deployment:

```bash
$ kubectl get pods -o wide

NAME                           READY   STATUS              RESTARTS   AGE   IP            NODE                                NOMINATED NODE
demo-deploy-64567bf9df-49k9b   1/1     Running             0          22s   172.16.0.42   aks-agentpool-38816970-vmss000001   <none>
demo-deploy-64567bf9df-5pjf6   1/1     Running             0          22s   172.16.0.96   aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-5r868   1/1     Running             0          22s   172.16.0.69   aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-8cnnv   0/1     ContainerCreating   0          22s   <none>        aks-agentpool-38816970-vmss000000   <none>
demo-deploy-64567bf9df-8fdkf   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-c5f5d   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-cf8xx   1/1     Running             0          22s   172.16.0.68   aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-czh8n   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-dq5nh   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-dzn5p   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-g2hx2   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-g52j7   0/1     ContainerCreating   0          22s   <none>        aks-agentpool-38816970-vmss000000   <none>
demo-deploy-64567bf9df-gjbhj   1/1     Running             0          22s   172.16.0.75   aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-k4fkv   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-kxzr8   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-ljmqv   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-lm894   0/1     Pending             0          22s   <none>        <none>                              <none>
demo-deploy-64567bf9df-m5q6t   1/1     Running             0          22s   172.16.0.39   aks-agentpool-38816970-vmss000001   <none>
demo-deploy-64567bf9df-p2qhx   1/1     Running             0          22s   172.16.0.37   aks-agentpool-38816970-vmss000001   <none>
demo-deploy-64567bf9df-qmcr6   0/1     ContainerCreating   0          22s   <none>        aks-agentpool-38816970-vmss000000   <none>
demo-deploy-64567bf9df-sbnvk   0/1     ContainerCreating   0          22s   <none>        aks-agentpool-38816970-vmss000000   <none>
```

We see that a few pods got scheduled on different nodes while many others are in <em>Pending</em> status since there are no node that can accomodate them.

We can then refresh our VM Scale Set view in the Portal and see it is now scaling from 3 to 5 instances:

<img src="https://vincentlauzon.files.wordpress.com/2019/03/scaleset-scaling.png" alt="VM Scale Set scaling out" />

Once the scaling operation is completed, we can look again at the pods' status:

```bash
$ kubectl get pods -o wide
NAME                           READY   STATUS    RESTARTS   AGE     IP             NODE                                NOMINATED NODE
demo-deploy-64567bf9df-49k9b   1/1     Running   0          9m15s   172.16.0.42    aks-agentpool-38816970-vmss000001   <none>
demo-deploy-64567bf9df-5pjf6   1/1     Running   0          9m15s   172.16.0.96    aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-5r868   1/1     Running   0          9m15s   172.16.0.69    aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-8cnnv   1/1     Running   0          9m15s   172.16.0.34    aks-agentpool-38816970-vmss000000   <none>
demo-deploy-64567bf9df-8fdkf   1/1     Running   0          9m15s   172.16.0.149   aks-agentpool-38816970-vmss000004   <none>
demo-deploy-64567bf9df-cf8xx   1/1     Running   0          9m15s   172.16.0.68    aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-czh8n   1/1     Running   0          9m15s   172.16.0.104   aks-agentpool-38816970-vmss000003   <none>
demo-deploy-64567bf9df-dzn5p   1/1     Running   0          9m15s   172.16.0.123   aks-agentpool-38816970-vmss000003   <none>
demo-deploy-64567bf9df-g52j7   1/1     Running   0          9m15s   172.16.0.17    aks-agentpool-38816970-vmss000000   <none>
demo-deploy-64567bf9df-gjbhj   1/1     Running   0          9m15s   172.16.0.75    aks-agentpool-38816970-vmss000002   <none>
demo-deploy-64567bf9df-k4fkv   1/1     Running   0          9m15s   172.16.0.133   aks-agentpool-38816970-vmss000004   <none>
demo-deploy-64567bf9df-kxzr8   1/1     Running   0          9m15s   172.16.0.115   aks-agentpool-38816970-vmss000003   <none>
demo-deploy-64567bf9df-lm894   1/1     Running   0          9m15s   172.16.0.135   aks-agentpool-38816970-vmss000004   <none>
demo-deploy-64567bf9df-m5q6t   1/1     Running   0          9m15s   172.16.0.39    aks-agentpool-38816970-vmss000001   <none>
demo-deploy-64567bf9df-mpxgb   0/1     Pending   0          54s     <none>         <none>                              <none>
demo-deploy-64567bf9df-p2qhx   1/1     Running   0          9m15s   172.16.0.37    aks-agentpool-38816970-vmss000001   <none>
demo-deploy-64567bf9df-qmcr6   1/1     Running   0          9m15s   172.16.0.9     aks-agentpool-38816970-vmss000000   <none>
demo-deploy-64567bf9df-sbnvk   1/1     Running   0          9m15s   172.16.0.5     aks-agentpool-38816970-vmss000000   <none>
demo-deploy-64567bf9df-wj2pz   1/1     Running   0          9m15s   172.16.0.139   aks-agentpool-38816970-vmss000004   <none>
demo-deploy-64567bf9df-x7tqj   1/1     Running   0          9m15s   172.16.0.108   aks-agentpool-38816970-vmss000003   <none>
```

We can see that most pods managed to get scheduled on a pod.

There is one pod still in pending state.  Despite this, the Auto Scaler won't scale the cluster to 6 nodes as we set 5 as the maximum number of nodes.

<h2>Summary</h2>

We looked at how to deploy an Auto Scaler enabled AKS cluster using an ARM template.

<strong>This will likely change once the Public Preview period is over</strong>

We also looked at the VM Scale set implementation and how an auto scaling event is triggered.