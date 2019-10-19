---
title: Monitoring metrics in AKS
date: 2019-05-09 06:30:16 -04:00
permalink: /2019/05/09/monitoring-metrics-in-aks/
categories:
- Solution
tags:
- Containers
- Data
- Operations
---
<img style="float:right;padding-right:5px;" title="From pixabay.com" src="/assets/2019/5/monitoring-metrics-in-aks/connection-control-center-desk-256219-e1556816181320.jpg" />

AKS has a <a href="https://docs.microsoft.com/en-us/azure/azure-monitor/insights/container-insights-overview">nice integration with Azure monitor</a>.  Out of the box there are a couple of dashboards for common metrics.

What if you need to go beyond those metrics?

This is what we're going to do in this article.  I'm going to show how to get the CPU usage per container.  Along the way you should learn enough to be able to dig other information you need.

As usual, <a href="https://github.com/vplauzon/aks/tree/master/monitor-metrics">code is in GitHub</a>.

<h2>Solution Deployment</h2>

Here we are going to reuse elements of <a href="https://vincentlauzon.com/2019/04/02/requests-vs-limits-in-kubernetes/">Requests vs Limits in Kubernetes</a> article.  We tweaked it a little, but it is otherwise very similar.

We are going to deploy an AKS cluster along a Log Analytics workspace and the Container Insight solution.

We'll need the Azure CLI tool connected to an Azure subscription.

First, let's download an <a href="https://github.com/vplauzon/aks/blob/master/monitor-metrics/deploy.json">ARM template</a> and <a href="https://github.com/vplauzon/aks/blob/master/monitor-metrics/create-cluster.sh">a script</a> invoking it:

```bash
curl https://raw.githubusercontent.com/vplauzon/aks/master/monitor-metrics/deploy.json > deploy.json
curl https://raw.githubusercontent.com/vplauzon/aks/master/monitor-metrics/create-cluster.sh > create-cluster.sh
```

We are going to run that script with five parameters:

<table>
<thead>
<tr>
  <th>Parameter</th>
  <th>Description</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Name of the resource group</td>
  <td>If the group doesn't exist, the script will create it</td>
</tr>
<tr>
  <td>Azure region</td>
  <td>Any Azure region where AKS is supported</td>
</tr>
<tr>
  <td>Name of workspace</td>
  <td>This needs to be unique</td>
</tr>
<tr>
  <td>Name of cluster</td>
  <td>This is also used as the DNS prefix for the cluster, hence must be unique as well</td>
</tr>
<tr>
  <td>Service Principal Application ID</td>
  <td>Application ID of a Service Principal</td>
</tr>
<tr>
  <td>Service Principal Object ID</td>
  <td>Object ID of the same Service Principal</td>
</tr>
<tr>
  <td>Service Principal Password</td>
  <td>Password of the same Service Principal</td>
</tr>
</tbody>
</table>

The last three parameters are related to the Service Principal that will be used by AKS.  See <a href="https://vincentlauzon.com/2018/08/23/creating-a-service-principal-with-azure-cli/">this article</a> on how to create a service principal and recover this information.

Let's run the command locally, e.g.:

```bash
./create-cluster.sh aks-group eastus myuniquelaworkspace myuniqueaks \
    <my-principal-app-id> \
    <my-principal-object-id> \
    <my-principal-password>
```

This takes a few minutes to execute.

<h2>Kubernetes deployment</h2>

Let's deploy a set of pods in the cluster using the following <a href="https://github.com/vplauzon/aks/blob/master/monitor-metrics/service.yaml">yaml file</a>:

```Javascript
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpu-ram-api
spec:
  replicas: 6
  selector:
    matchLabels:
      app:  cpu-ram-api
  template:
    metadata:
      labels:
        app: cpu-ram-api
    spec:
      containers:
      - name: cpu-ram-request-api
        image: vplauzon/cpu-ram-request-api:4
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64M"
            cpu: "250m"
          limits:
            memory: "128M"
            cpu: "2"
---
apiVersion: v1
kind: Service
metadata:
  name: cpu-ram-request-api-svc
spec:
  type: LoadBalancer
  ports:
  - port: 80
  selector:
    app: cpu-ram-api
```

We have a deployment and a public service load balancing the pods of the deployment.

The pod has one container.  Container's image is <a href="https://hub.docker.com/r/vplauzon/cpu-ram-request-api">vplauzon/cpu-ram-request-api</a>.  The <a href="https://github.com/vplauzon/aks/tree/master/requests-vs-limits/CpuRamRequestSolution">source code of this container also is on GitHub</a>.  It's an API implemented in C#.  It basically keeps the CPU busy and allocate memory.  This was built on purpose for creating spikes on workloads to test monitoring.

The deployment script already connected <em>kubectl</em> CLI to our cluster (i.e. executed the <em>az aks get-credentials</em> command for us).  So, we can simply deploy the yaml file with the following command:

```bash
kubectl apply -f https://raw.githubusercontent.com/vplauzon/aks/master/monitor-metrics/service.yaml
```

If we look at the pods:

```bash
$ kubectl get pods

NAME                           READY   STATUS    RESTARTS   AGE
cpu-ram-api-5976cfdfb7-8p5k2   1/1     Running   0          6m3s
cpu-ram-api-5976cfdfb7-crsbh   1/1     Running   0          6m4s
cpu-ram-api-5976cfdfb7-m26gn   1/1     Running   0          6m6s
cpu-ram-api-5976cfdfb7-pgf9v   0/1     Pending   0          6m3s
cpu-ram-api-5976cfdfb7-qj55t   1/1     Running   0          6m4s
cpu-ram-api-5976cfdfb7-zrlcl   1/1     Running   0          6m3s
```

We see that one of the pods is pending because our single-node cluster is full.

Now let's look at the service:

```bash
$ kubectl get svc

NAME                      TYPE           CLUSTER-IP    EXTERNAL-IP   PORT(S)        AGE
cpu-ram-request-api-svc   LoadBalancer   10.0.40.102   40.70.77.7    80:31744/TCP   7m8s
kubernetes                ClusterIP      10.0.0.1      <none>        443/TCP        123m
```

We need to copy the external IP of the <em>cpu-ram-request-api-svc</em> service.  That's the Azure public IP associated to the load balancer of that service.  Let's store that in a shell variable:

```bash
ip=40.70.77.7  # Here, let's replace that specific IP with the one from our cluster
```

Now let's call the API we just deploy a few times:

```bash
$ curl "http://$ip/"

{"duration":1,"numberOfCore":1,"ram":10,"realDuration":"00:00:00.9995901"}

$ curl "http://$ip?duration=45"

{"duration":45,"numberOfCore":1,"ram":10,"realDuration":"00:00:44.9990431"}

$ curl "http://$ip?duration=20&core=2"

{"duration":20,"numberOfCore":2,"ram":10,"realDuration":"00:00:20.0014578"}
```

Those will create a few CPU spikes we'll be able to pick up in the logs.

<h2>KubePodInventory</h2>

Let's open the Log Analytics workspace in the Azure Portal.  Under <em>General</em>, let's select the <em>Logs</em> pane.

On the left-hand side, we can see two categories of "tables":

<ul>
<li>ContainerInsights</li>
<li>LogManagement</li>
</ul>

Although the key for performance metrics is a <em>LogManagement</em> table, let's start by looking at the <em>ContainerInsights</em>:

<img src="/assets/2019/5/monitoring-metrics-in-aks/container-tables.png" alt="Container tables" />

Those are all AKS related.

Since we want to find out the CPU usage for pods, let's look at <em>KubePodInventory</em>.  We can type the following query:

```sql
KubePodInventory 
| limit 5
```

We can then click <em>Run</em> (or type <em>Shift-Enter</em>).  The screen should look as follow once we exploded the <em>KubePodInventory</em> table on the left:

<img src="/assets/2019/5/monitoring-metrics-in-aks/kubepodinventory-exploration.png" alt="KubePodInventory exploration" />

This is a good first step to explore logs, to get a feel of the data available.

The query language used is <em>Kusto</em>.  There is a <a href="https://docs.microsoft.com/en-us/azure/kusto/query/tutorial">quick tutorial here</a> and a <a href="https://aka.ms/sql-analytics">cheat sheet vs SQL here</a>.  The syntax might look funny at first but typically people get the hang of it within the first hour.

We can see there are a lot of IDs in the data.  For instance, the <em>TenantId</em> is actually the Log Analytics Workspace ID.

We can see the <em>Computer</em> column corresponds to AKS nodes.

To get a better feel of a column, we can fetch its distinct (unique) values.  For instance:

```sql
KubePodInventory 
| distinct Namespace, Name
| sort by Namespace, Name asc
```

gives a list of <em>Name</em> that correspond to what we would get from a <code>kubectl get pods --all-namespaces</code>.

The left pane is useful to see the name and type of columns.

<h2>Perf</h2>

Let's look at the <em>Perf</em> table under <em>LogManagement</em> category.  Its schema looks like a metric table with its <em>TimeGenerated</em> and <em>CounterValue</em> columns.

We can throw a few queries.  For instance:

```sql
Perf 
| distinct ObjectName
```

shows us only two object names:

<ul>
<li>K8SContainer</li>
<li>K8SNode</li>
</ul>

This tells us that AKS has put some data in that table.

```sql
Perf 
| distinct InstanceName
```

This last query gives us very long ids where some ends with the name of containers.

This is where some magic must be known.  <em>Perf</em> is a generic table used for VM, AKS and many other Azure resource metrics.  It therefore doesn't have a <em>pod</em>, <em>container</em>, <em>namespace</em>, etc. table.

Metrics are typically tracked at the container level.  For containers <em>InstanceName</em> corresponds to:

<strong>cluster-id</strong>/<strong>pod id</strong>/<strong>container name</strong>

Thankfully we had all that information in <em>KubePodInventory</em>.  This will come in handy so we can filter the metrics for only the pods / containers we are interested in.

Another useful column is

```sql
Perf 
| distinct CounterName
| sort by CounterName asc 
```

where the values are:

<ul>
<li>cpuAllocatableNanoCores</li>
<li>cpuCapacityNanoCores</li>
<li>cpuLimitNanoCores</li>
<li>cpuRequestNanoCores</li>
<li><strong>cpuUsageNanoCores</strong></li>
<li>memoryAllocatableBytes</li>
<li>memoryCapacityBytes</li>
<li>memoryLimitBytes</li>
<li>memoryRequestBytes</li>
<li>memoryRssBytes</li>
<li>memoryWorkingSetBytes</li>
<li>restartTimeEpoch</li>
</ul>

<h2>Joining KubePodInventory &amp; Perf</h2>

Let's try to find those values in <em>KubePodInventory</em>:

```sql
KubePodInventory 
| distinct ClusterId, PodUid, ContainerName
```

We can see the result is close to what we need:

<img src="/assets/2019/5/monitoring-metrics-in-aks/kubepodinventory-trinity.png" alt="KubePodInventory trinity" />

The first two columns look ok.  The <em>ContainerName</em> is prepended by an ID we do not need.  We can get rid of the prefix easily:

```sql
KubePodInventory 
| extend JustContainerName=tostring(split(ContainerName, '/')[1])
| distinct ClusterId, PodUid, JustContainerName
```

This gives us what we need.

<img src="/assets/2019/5/monitoring-metrics-in-aks/kubepodinventory-fixed.png" alt="Fixed Container Name" />

We now have everything to join the two tables:

```sql
let clusterName = "<our cluster name>";
let serviceName = "cpu-ram-request-api-svc";
let counterName = "cpuUsageNanoCores";
let startTime=ago(60m);
KubePodInventory
| where ClusterName == clusterName
| where ServiceName == serviceName
| where TimeGenerated >= startTime
| extend JustContainerName=tostring(split(ContainerName, '/')[1])
| extend InstanceName=strcat(ClusterId, '/', PodUid, '/', JustContainerName) 
| distinct Name, InstanceName
| join (
    Perf
    | where TimeGenerated >= startTime
    | where CounterName == counterName
    ) on InstanceName
| project CounterValue, TimeGenerated, Name
| render timechart 
```

We declared a few variables at the beginning using the <em>let</em> keyword.  First, we want to filter for our cluster.  In general, one Log Analytics workspace could be use as target for multiple AKS clusters.  Then we want to filter for a service name.  We also want to look only at the CPU usage metrics.  Finally, we are looking at a 60 minutes window.

We might need to perform a few more <code>curl "http://$ip?duration=20&amp;amp;core=2</code> if more than 60 minutes elapsed since we did it.  It takes a few minutes for logs to get ingested and available in the workspace.

<img src="/assets/2019/5/monitoring-metrics-in-aks/chart.png" alt="Chart" />

We get a chart of exactly what we needed:  the CPU usage of each pod.

Time is given in GMT.  In order to convert it, <a href="https://docs.microsoft.com/en-us/azure/azure-monitor/log-query/datetime-operations#time-zones">we can add / substract hours</a>.  For instance, in Montreal, currently (early May):

```sql
| extend LocalTimeGenerated = TimeGenerated - 4h
| project CounterValue, LocalTimeGenerated, Name
```

As usually with Log Analytics, we can save this query.  We can also "pin" it to a shared dashboard.

<h2>Summary</h2>

We just took a little dive inside the data collected by the Azure Monitor solution for AKS.

Using the content of this article, you should easily be able to track different metrics.

This is useful for dashboards but also for forensic analysis, i.e. after the fact troubleshooting.