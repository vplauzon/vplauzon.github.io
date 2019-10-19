---
title:  Testing outbound connections in AKS-Kubenet and ACI
date:  2019-03-26 10:30:03 +00:00
permalink:  "/2019/03/26/testing-outbound-connections-in-aks-kubenet-and-aci/"
categories:
- Solution
tags:
- Containers
- Networking
- Security
- Serverless
---
<img style="float:right;padding-right:20px;" title="From pixabay.com" src="https://vincentlauzon.files.wordpress.com/2019/03/arrow-communication-direction-235975-e1553284557941.jpg" />

What happens if a pod in AKS initiates a connection with a private endpoint?  Which private IP address does the outbound connection uses?

This is relevant for a private IP inside the same VNET, a peered VNET or an IP accessible via a VPN or Express Route.

In general, the private IP of the VM is used as an outbound private IP.  This shouldn't be confused with the <a href="https://docs.microsoft.com/en-us/azure/load-balancer/load-balancer-outbound-connections#scenarios">slightly more complex rules about which public IP is used when we contact a public endpoint</a>.

But if we are using <a href="https://vincentlauzon.com/2018/09/06/aks-with-kubenet-vs-azure-networking-plug-in/">kubenet plugin</a>, Kubernetes does its own networking virtualization where pods get a cluster IP.  Would that IP be used as an outbound IP?

I thought it would be interesting to simply do an experience to determine the answer.

<img src="https://vincentlauzon.files.wordpress.com/2019/03/experience.png" alt="Experience" />

Basically, we will deploy an AKS cluster with Kubenet plugin in a subnet.  In a <a href="https://docs.microsoft.com/en-us/azure/container-instances/container-instances-vnet">separate subnet</a>, we are going to deploy an Azure Container Instance (ACI).  On that latter subnet we are going to deploy a Network Security Group (NSG) to guard incoming connections.

We are going to test a connection to ACI from AKS and see how we can block it with NSGs.

As usual, <a href="https://github.com/vplauzon/aks/tree/master/kubenet-outbound">code is in Github</a>.

<h2>Creating the cluster</h2>

Let's start by downloading a <a href="https://github.com/vplauzon/aks/blob/master/kubenet-outbound/create-cluster.sh">script file from GitHub</a>:

```bash
curl https://raw.githubusercontent.com/vplauzon/aks/master/kubenet-outbound/create-cluster.sh \
  > create-cluster.sh
```de]

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
  <td>Must be compatible with regions supporting ACI in VNET.  At the time of this writing, i.e. end-of-March 2019, that means one of the following:  EastUS2EUAP, CentralUSEUAP, WestUS, WestCentralUS, NorthEurope, WestEurope, EastUS or AustraliaEast.</td>
</tr>
<tr>
  <td>Name of cluster</td>
  <td>This is also used as the DNS prefix for the cluster, hence must be unique</td>
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

The last three parameters are related to the Service Principal that will be used by AKS.

Let's run the command locally, e.g.:

```bash
./create-cluster.sh aks-group eastus myuniqueaks \
    <my-principal-app-id> \
    <my-principal-object-id> \
    <my-principal-password>
```ssword&gt;
[/code]

This will run for several minutes and create 4 resources in the resource group:

<ol>
<li>A Network Security Group (NSG) named <em>aciNsg</em></li>
<li>A Virtual Network named <em>cluster-vnet</em></li>
<li>An Azure Container Instance (ACI) named <em>myContainerGroup</em></li>
<li>An AKS cluster named as specified in the script parameters</li>
</ol>

The script will also connect kubectl to the newly created cluster (<code>az aks get-credentials</code>).

<h2>ACI IP address</h2>

The script also outputs an IP address, e.g.:

```bash
Successfully deployed cluster myuniqueaks and ACI with IP 172.16.32.4

Connect kubectl to newly created cluster myuniqueaks...

Merged "myuniqueaks" as current context in /home/myusername/.kube/config
```ig
[/code]

Here the IP is <em>172.16.32.4</em>.  Let's copy that IP.

<h2>Connect to ACI</h2>

Let's do the experiment.  Let's deploy an observer pod within AKS:

```bash
$ kubectl run --rm -it --image=appropriate/curl:latest observer --generator=run-pod/v1 --command sh
```

This lands our session on a command prompt within a pod.

Let's try to contact ACI:

```bash
/ # watch -n 2 curl -v --connect-timeout 1 <ACI IP>
```/code]

We should see something like refreshing every 2 seconds:

```bash
Every 2s: curl -v --connect-timeout 1 172.16.32.4                                                   2019-03-22 21:56:44

* Rebuilt URL to: 172.16.32.4/
*   Trying 172.16.32.4...
* TCP_NODELAY set
* Connected to 172.16.32.4 (172.16.32.4) port 80 (#0)
> GET / HTTP/1.1
> Host: 172.16.32.4
> User-Agent: curl/7.59.0
> Accept: */*
>
* HTTP 1.0, assume close after body
< HTTP/1.0 200 OK
< Content-Type: text/html; charset=utf-8
< Content-Length: 130
< Server: Werkzeug/0.14.1 Python/2.7.14
< Date: Fri, 22 Mar 2019 21:56:44 GMT
<
* Closing connection 0
<h3>Hello World!</h3><b>Hostname:</b> wk-caas-416604191f9b41ada1766436a3c4673b-203163b74dfca1b08abdec<br/><b>Visits:</b> undefined
```3163b74dfca1b08abdec&lt;br/&gt;&lt;b&gt;Visits:&lt;/b&gt; undefined
[/code]

The key part is that connection is established, so AKS can talk to ACI.

<h2>Modifying NSG</h2>

Let's go to the Azure Portal and look at the NSG:

<img src="https://vincentlauzon.files.wordpress.com/2019/03/nsg.png" alt="NSG Inbound rules" />

The first rule let traffic coming from 172.16.0.0/20.  This correspond to the subnet occupied by AKS nodes.

The second rule let Azure Firewall probe pass (not used here but always good to have) while the third rule forbids every other traffic.

Let's modify the first rule by simply changing its priority from <em>100</em> to <em>400</em>.  We should end up with:

<img src="https://vincentlauzon.files.wordpress.com/2019/03/nsg-modified.png" alt="Modified NSG Inbound rules" />

Now if we look at our watch, we should have something like the following:

```bash
Every 2s: curl -v --connect-timeout 1 172.16.32.4                                                   2019-03-22 22:03:08

* Rebuilt URL to: 172.16.32.4/
*   Trying 172.16.32.4...
* TCP_NODELAY set
* Connection timed out after 1001 milliseconds
* Closing connection 0
curl: (28) Connection timed out after 1001 milliseconds
```

Basically, the connection now fails.

<h2>Summary</h2>

We can conclude from our experiment that outbound connection from an AKS cluster with kubenet plugin are still within the AKS subnet.

This means that to allow access for AKS workload, we simply need to "whitelist" the AKS subnet.

That whitelisting doesn't discriminate between AKS workloads:  any pod running on the cluster will be whitelisted.