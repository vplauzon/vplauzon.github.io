---
title:  Deploying AKS with ARM Template – Network integration
date:  2018-08-28 06:30:21 -04:00
permalink:  "/2018/08/28/deploying-aks-with-arm-template-network-integration/"
categories:
- Solution
tags:
- Automation
- Containers
- Networking
---
<img style="float:right;" src="https://vincentlauzon.files.wordpress.com/2018/08/aerial-view-architecture-bridges-681335-e1534512788662.jpg" title="From Pexels" />

In a <a href="https://vincentlauzon.com/2018/08/21/kubernetes-services-in-azure-aks-network-integration/">past article</a>, we looked at how <a href="https://vincentlauzon.com/?s=aks">Azure Kubernetes Services</a> (AKS) integrated with Azure Networking.

AKS is a managed Kubernetes service in Azure.

In this article, we are going to do two things:

<ol>
<li>Deploy an AKS cluster with <em>Advanced Networking</em> using an Azure ARM Template.</li>
<li>Deploy a service on the cluster and validate the networking view we formed in the last article.</li>
</ol>

As usual, the <a href="https://github.com/vplauzon/aks/tree/master/aks-vnet-arm">code is in GitHub</a>.

In AKS, <em>Advance Networking</em> means the cluster gets deployed in an existing Azure Virtual Network.

In the end, we should be able to experience the following:

<img src="https://vincentlauzon.files.wordpress.com/2018/08/service1.png" alt="Service" />

We will only ommit the port mapping and run everything on port 80.

We'll see that:

<ul>
<li>Nodes &amp; pods deployed in one subnet</li>
<li>Service's internal load balancer is deployed in a different subnet</li>
<li>Service <em>internal IP</em> won't be part of the Virtual Network and will be accessible only from within the cluster</li>
</ul>

<h2>Deploying AKS</h2>

Let's deploy AKS:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https:%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Faks%2Fmaster%2Faks-vnet-arm%2Fdeploy.json"><img src="http://azuredeploy.net/deploybutton.png" alt="Deploy" /></a>

The first parameter is the <em>DNS Prefix</em> which is used for the domain name of the cluster (used by the API).

AKS needs a service principal as <a href="https://vincentlauzon.com/2018/05/10/understanding-identities-in-azure-aks-kubernetes/">we've explored in a past article</a>.  The ARM template hence requires three parameters related to the service principal:

<ol>
<li><em>Service Principal App ID</em></li>
<li><em>Service Principal Object ID</em></li>
<li><em>Service Principal Secret</em></li>
</ol>

We recently wrote an article showing <a href="https://vincentlauzon.com/2018/08/23/creating-a-service-principal-with-azure-cli/">how to create a Service Principal</a>.  We recommend creating a principal to use the template.

The template doesn't expose <em>options</em> as parameters.  We "hard coded" a lot of things in ARM variables which are typically parameters:

<ul>
<li>Network IP ranges</li>
<li>Machine size</li>
<li>Instance count</li>
<li>SSH Public Key</li>
</ul>

We did that for simplicity.  It is quite easy to modify the template to expose options.

In order to create a SSH public key, we did the following command in Linux:  <code>ssh-keygen -o -f key -P ""</code>.  This creates a public key locally in file <code>key.pub</code>.  We can then <code>cat key.pub</code> the file to get the content.

Let's now look at the deployment.

<h3>Cluster</h3>

By looking at the cluster overview, we should see it has the <em>Kubernetes version</em> of 1.11.1.  This was the latest at the time of this writing (mid August 2018).

The total cores match the B2 VM size (times 3 nodes).

<h3>Virtual Network</h3>

The Virtual Network is segregated in two subnets as planned:

<img src="https://vincentlauzon.files.wordpress.com/2018/08/subnets1.png" alt="Subnets" />

Both subnets are /20 hence accomodating 4096 IPs each (see <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing#IPv4_CIDR_blocks">CIDR notation</a>).  Of those, <a href="https://docs.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq#are-there-any-restrictions-on-using-ip-addresses-within-these-subnets">5 are used by Azure as stated in the FAQ</a>:

<blockquote>
  Azure reserves some IP addresses within each subnet. The first and last IP addresses of each subnet are reserved for protocol conformance, along with the x.x.x.1-x.x.x.3 addresses of each subnet, which are used for Azure services.
</blockquote>

This explains why the <em>services</em> subnet has only 4091 IPs left (4096 - 5).  The <em>aks</em> subnet has an extra 93 IPS taken away.  There are 3 nodes in the cluster, which means each node takes 31 IPs.  This is one IP for the VM and 30 IPs for the pods on the VM.

The maximum number of pods default to 30 but can be modified in the <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.containerservice/managedclusters#managedclusteragentpoolprofile-object">ARM template with the <em>max pods</em> property</a>.

The VNET IP address needs to be compatible with <a href="https://en.wikipedia.org/wiki/Private_network">RFC 1918</a>.  This means the IP ranges do not clash with public IPs (e.g. bing.com).

<h3>Virtual Network's access</h3>

Let's look at the access control on the virtual network.

<img src="https://vincentlauzon.files.wordpress.com/2018/08/iam1.png" alt="Access Control (IAM)" />

We notice the Service Principal we provided in input is <em>Network Contributor</em>.  This is a <a href="https://docs.microsoft.com/en-us/azure/aks/networking-overview#advanced-networking-prerequisites">requirement for AKS in Advanced Networking mode</a>.

This was accomplished using a role assignment resource.  We <a href="https://vincentlauzon.com/2018/08/15/rbac-and-role-assignment-using-arm-templates/">covered that in a previous article</a>:

```JavaScript
{
    "type": "Microsoft.Network/virtualNetworks/providers/roleAssignments",
    "apiVersion": "2017-05-01",
    "name": "[variables('Role Assignment Name')]",
    "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNET Name'))]"
    ],
    "properties": {
        "roleDefinitionId": "[variables('Network Contributor Role')]",
        "principalId": "[parameters('Service Principal Object ID')]"
    }
}
```

This is convenient as the ARM template hence self-sufficient.

<h3>Buddy Resource Group</h3>

The AKS cluster appears as one resource in our resource group.  The underlying resources, the VMs constituting the cluster, are actually accessible to us.

They are in a resource group named <code>MC___</code>.

<img src="https://vincentlauzon.files.wordpress.com/2018/08/buddy.png" alt="Buddy group" />

We can see all resources we would expect from a cluster.

If look at one of the <em>NIC</em> and its IP configuration we can see the following:

<img src="https://vincentlauzon.files.wordpress.com/2018/08/nic.png" alt="" />

The NIC has multiple IPs.  The primary one is the node's IP while the secondary ones are a pool of IPs attributed to pods.

<h2>Deploy a service</h2>

Let's deploy a service to Kubernetes.

We use a trivial image exposing a one-page web site telling on which node it is running.

<h3>Login to Kubernetes</h3>

First, let's login to Kubernetes with the following commands:

```bash
az aks install-cli
az aks get-credentials --resource-group <Resource Group> --name cluster
```

The first command only need to be done once in an environment.

The second actually logs us in:

<ul>
<li><em>Resource Group</em> is the name of the resource group where AKS is deployed</li>
<li><em>cluster</em> is the name of the AKS cluster (hard coded in the ARM template)</li>
</ul>

<h3>Deploying the service</h3>

Let's deploy our service on the cluster.

The <a href="">yaml file is on GitHub</a> and has the following content:

```text
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app:  web-get-started
  template:
    metadata:
      labels:
        app: web-get-started
    spec:
      containers:
      - name: myapp
        image: vplauzon/get-started:part2-no-redis
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web-service
  annotations:
    service.beta.kubernetes.io/azure-load-balancer-internal: "true"
    service.beta.kubernetes.io/azure-load-balancer-internal-subnet: "services"
spec:
  type: LoadBalancer
  ports:
  - port: 80
  selector:
    app: web-get-started
```

The first part is a deployment of a replica-set of pods.  There are 3 replicas and the container image is vplauzon/get-started:part2-no-redis.  The <a href="https://github.com/vplauzon/containers/tree/master/get-started-no-redis">code for that container is on GitHub</a>.

The second part is a service.  It does a selection on the labels we defined for the replica set, hence it will load balanced the pods we deployed.  We also pass some annotations.  The first one states that we want to use Azure Internal load balancer, i.e. using a private ip for the load balancer.  The second one states in which subnet we want the load balancer to be.

We create this deployment with the command:

```bash
kubectl create -f service.yaml
```

Let's look at how that impact our Azure resources.

<h3>Buddy Resource Group</h3>

Let's go back to our buddy resource group:

<img src="https://vincentlauzon.files.wordpress.com/2018/08/buddy-with-lb.png" alt="Buddy group containing a load balancer" />

We see a load balancer that wasn't there before.

<h3>Virtual Network</h3>

If we go back to our Virtual Network and scroll down we should find the load balancer:

<img src="https://vincentlauzon.files.wordpress.com/2018/08/lb-ip.png" alt="Load balancer IP" />

We can see it belongs to the <em>services</em> subnet and has an IP in that subnet range.

<h3>In Kubernetes</h3>

Let's look at how Kubernetes interpret those.

Let's type:

```bash
kubectl get pods -o wide
```

This gives us a result similar to:

```bash
NAME                   READY     STATUS    RESTARTS   AGE       IP            NODE
web-54b885b89b-9q9cr   1/1       Running   0          15m       172.16.0.70   aks-agentpool-15447536-0
web-54b885b89b-b25rz   1/1       Running   0          15m       172.16.0.29   aks-agentpool-15447536-2
web-54b885b89b-khklp   1/1       Running   0          15m       172.16.0.43   aks-agentpool-15447536-1
```

We see 3 pods, corresponding to the replica set.  They are each deployed in a different node.  They each have an IP address belonging to the <em>aks</em> subnet.

Now if we type:

```bash
kubectl get services -o wide
```

We should see:

```bash
NAME          TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE       SELECTOR
kubernetes    ClusterIP      10.0.0.1       <none>        443/TCP        1d        <none>
web-service   LoadBalancer   10.0.125.114   172.16.16.4   80:30981/TCP   17m       app=web-get-started
```

Let's ignore the <em>kubernetes</em> service, as this is an internal service.  Let's concentrate on the <em>web-service</em> service.

We see it is of type <em>LoadBalancer</em> as we requested.  It has a <em>cluster-ip</em> and an <em>external-ip</em>.  The <em>external-ip</em> is the Azure Load Balancer private IP.  The <em>cluster-ip</em> is this ip accessible only from within the cluster.  It also has a port on each node where the service is accessible.

<h2>Testing</h2>

In order to test, we need to have connectivity with the subnets.

The easiest way to do that is to create a VM and <em>peer</em> its network to the AKS network.  We can then ssh (or RDP) to that VM and be "local" to the AKS cluster.  This simulates having an Express Route (or VPN) connection to the AKS virtual network.

We recommend using our <a href="https://github.com/vplauzon/containers/tree/master/DockerVM">Docker VM</a> for that.

From that VM we can <code>curl</code> to the first pod, i.e. IP 172.16.0.70 in our case:

```bash
curl 172.16.0.70
```

and receive the following:

```bash
<h3>Hello World!</h3><b>Hostname:</b> web-54b885b89b-9q9cr<br/><b>Visits:</b> undefined
```

We can note that <em>web-54b885b89b-9q9cr</em> is the name of the pod.

We can do that for each pod.

We can also <em>curl</em> the service:

```bash
curl 172.16.16.4
```

We should receive a similar return.  If we keep running this command we should see that we round robin through the pods.

We could also try the internal port (in our case 30981).  For this we need to learn the nodes' IPs:

```bash
kubectl get nodes -o wide
```

The returned <em>internal-ip</em> is the node's IP:

```bash
NAME                       STATUS    ROLES     AGE       VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME
aks-agentpool-15447536-0   Ready     agent     1d        v1.11.1   172.16.0.66   <none>        Ubuntu 16.04.5 LTS   4.15.0-1018-azure   docker://1.13.1
aks-agentpool-15447536-1   Ready     agent     1d        v1.11.1   172.16.0.35   <none>        Ubuntu 16.04.5 LTS   4.15.0-1018-azure   docker://1.13.1
aks-agentpool-15447536-2   Ready     agent     1d        v1.11.1   172.16.0.4    <none>        Ubuntu 16.04.5 LTS   4.15.0-1018-azure   docker://1.13.1
```

So now if we do:

```bash
curl 172.16.0.66:30981
```

We will again round robin through the pods.  The same result would occur with the IP of any node.

In order to test the internal IPs, we need to be on the cluster itself.  This can easily be done by running a container in interactive mode:

```bash
kubectl run -i --tty console --image=appropriate/curl -- sh
```

Here we simply take the classic <a href="https://kubernetes.io/docs/reference/kubectl/cheatsheet/#interacting-with-running-pods">Kubernetes trick</a> but using the <a href="https://hub.docker.com/r/appropriate/curl/">appropriate/curl</a> image.  That image has <em>curl</em> installed on it, which we can then use:

```bash
curl 10.0.125.114
```

or whatever the <em>cluster-ip</em> of the service is.  This will again round robin through the pods.

Since the ARM Template activated the <a href="https://docs.microsoft.com/en-us/azure/aks/http-application-routing">HTTP Application Routing</a>, we could actually use the service name:

```bash
curl web-service
```

which would work the same way.

<h2>Network Profile</h2>

Let's finally look at the <em>Network profile</em> in the ARM template:

```JavaScript
"networkProfile": {
    "networkPlugin": "azure",
    "serviceCidr": "[variables('Service Cidr')]",
    "dnsServiceIP": "[variables('Dns Service IP')]",
    "dockerBridgeCidr": "[variables('Docker Bridge Cidr')]"
}
```

With the variables:

```JavaScript
"Service Cidr": "10.0.0.0/16",
"Dns Service IP": "10.0.0.0",
"Docker Bridge Cidr": "10.2.0.1/16"
```

Those are explained in the <a href="https://docs.microsoft.com/en-us/azure/aks/networking-overview#plan-ip-addressing-for-your-cluster">AKS documentation</a>.  They are also explained in the <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.containerservice/managedclusters#containerservicenetworkprofile-object">ARM Template documentation</a>.

The <em>Service Cidr</em> is where those cluster-ip for services are taken from.  In our case, we had <em>10.0.125.114</em>.  Those IPs are accessible only from the cluster.  The important thing to remember is to choose a range that won't be used by our applications.  For instance, if one of our app uses an internal SAP server, we do not want the address of that server to be in the service cidr range.  Kubernetes will redirect those IPs and we'll never reach our SAP server.

<h2>Summary</h2>

We've basically dived into the view we formed in our <a href="https://vincentlauzon.com/2018/08/21/kubernetes-services-in-azure-aks-network-integration/">past article</a>:

<img src="https://vincentlauzon.files.wordpress.com/2018/08/service1.png" alt="Service" />

The <strong>important things to remember</strong> are:

<ul>
<li>Nodes &amp; pods deployed in one subnet</li>
<li>We control in which subnet a service gets deployed</li>
<li>Service <em>internal IP</em> aren't part of the Virtual Network and are accessible only from within the cluster</li>
</ul>

We can also <a href="https://docs.microsoft.com/en-us/azure/aks/internal-lb#specify-an-ip-address">control their private IP</a> (which we didn't do here).

We wanted to demonstrate that, as with all things, there is no magic.  AKS simply integrates with Azure Networking and create resources on the fly.