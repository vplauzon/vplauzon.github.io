---
title:  Access Control in Azure Data Lake Storage
permalink: /2020/07/16/access-control-in-azure-data-lake-storage
categories:
- Solution
tags:
- Data
- Security
date:  2020-07-02
---
<img style="float:right;padding-left:20px;" title="From pexels.com" src="/assets/posts/2020/3/access-control-in-azure-data-lake-storage/fence.jpg" />

About a year ago I did an [article about Azure Data Lake Storage (ADLS) gen 2 and how to use its REST API](https://vincentlauzon.com/2019/05/15/how-to-use-azure-data-lake-storage-rest-api/).

ADLS gen 2 unlocked a bunch of scenarios.  It is present in every region, it enables analytics operations (e.g. renaming folders), it supports HDFS protocol, it scales, etc.  .

In my experience, it is becoming the de facto standard for data lake raw storage in Azure.

A key feature it added was Access Control List (ACL) at the folder / file level.  That gives us a better granularity for access control which is quite necessary in something as vast as a Data Lake.

I often use it with little security on.  Maybe you do too.  Hence, I had to learn again some quirks about the security model this week.  Some of the quirks are due to misplaced expectation & comparing it to an on-prem / single server technology (which it definitely is not).  Some quirks are there because it's an evolution of Azure Storage which wasn't built with folders in mind.

I thought I would do an article to list those gotcha.  Hopefully, that will speed up anyone doing some security modelling on ADLS for the first time or first time in a while.  Here it is.

The [online documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-access-control) contains most of that information but doesn't emphasises on our cognitive biases as I do here ;)

## Admins can't read it

This one we usually hit even in a low-security context.

We just provisioned an ADLS account.  We are admin of the subscription.  And...  we can't write or even read the data lake.  What's going on?

![admin](/assets/posts/2020/3/access-control-in-azure-data-lake-storage/admin.png)

We actually spent quite a bit of time explaining it in [this article](/2020/02/27/impersonating-user-in-adls-with-kusto) under the section *Why didn’t it work?*.  We recommend reading that section to get a deeper understanding.

In summary:  being owner or contributor sounds like we have all the rights in a subscription.  The thing is that is for the control plane.  This doesn't give us permissions on the data plane.  That being said, as contributor, we can give ourselves data plane roles.  It's just that we don't have them by default.

How come we can still read and write when using [Azure Storage Explorer tool](https://azure.microsoft.com/en-us/features/storage-explorer/) then?  That is because that tool uses our Control Plane access to get the Storage Account *Access Keys* and then use those to access the data.  This makes it more surprising when we try another tool (e.g. impersonation with Azure Data Explorer, Azure Synapse Spark or Azure Databricks) and fail to access the data.

## Data Reader is a blunt instrument

One of the pre-defined roles in the Data Plane is [Storage Blob Data Reader](https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-reader).

<img style="float:left;padding-right:20px;" title="From pexels.com" src="/assets/posts/2020/3/access-control-in-azure-data-lake-storage/reader.jpg" />  As an Azure Role, it can be applied to any resource or resource group with a principal (user or service principal).  So, we can apply it to an entire ADLS account or to a container.

A container is the "smallest grain" at which we can apply it.  Folders aren't Azure Resources.

Those roles make sense for some scenarios.  For instance, POCs & dev environments.  But also, for scenarios where a container is pretty homogeneous.  Logs for instance.

For a big Data Lake with multiple lines of business data though, giving access to an entire container is too broad.

That makes Data Reader (and Owner and Writer and the likes) a bit of a blunt instrument in many cases.

## ACL vs Data Reader

Enters Access Control Lists (ACLs).  With ACLs we can give access at the blob level if we want to.

![acl](/assets/posts/2020/3/access-control-in-azure-data-lake-storage/acl.png) As with any file system, it is way more manageable to give permissions at folder level and typically with the folders closer to the root.  This makes the security model simpler to manage but also simpler to understand.

Now does ACL supersedes roles such as Data Reader or is it the other way around?

It is the other way around.  If a user is Data Reader on a container, he/she doesn't need ACLs with reading permission:  he/she will be able to read the entire container.

Therefore, if we want to rely on ACLs, we shouldn't give any roles to users on containers / ADLS accounts.

## ACL and inheritance

Now here's a sequence of events that often leave users puzzled:

* We create an ADLS account
* We copy some data into it using Azure Storage Explorer
* We add ACL at the root of the container with the data with Read / Write / Execute for ourselves
* When using other tools or the REST API directly, we can't see any blobs / folders in the container

What happened then?

Quite simply:  **ACLs aren't inherited in a container's hierarchy**.

![Inheritance](/assets/posts/2020/3/access-control-in-azure-data-lake-storage/parent.png) Since we copied the blobs first, those blobs were created with the default permission set.  We added the ACL at the root *afterwards*.  So we can access the root.  We just can't access any of the blobs / folders underneath.

Currently (early July 2020), there are no mechanisms to inherit ACLs.  They need to be push down manually or (more likely) via scripts.

Another mechanism is to use *default*, which we'll cover now.

## What is "default"?

Opening "Manage Access" in Azure Storage Explorer, we are greeted with a couple of alien concepts.  One of them is *default*:

![default](/assets/posts/2020/3/access-control-in-azure-data-lake-storage/default.png)

This is the next best thing since we do not have inheritance:  we can set a default set of permissions to a folder that will be applied to new blobs / folders underneath it.

We could fix the sequence of events from the last section this way:

* We create an ADLS account
* We add a **default ACL** at the root of the container with the data with Read / Write / Execute for ourselves
* We copy some data into it using Azure Storage Explorer
* When using other tools or the REST API directly, we should see the blobs we copied since they were given the default permissions

## What is "execute"?

Next is execute.

![default](/assets/posts/2020/3/access-control-in-azure-data-lake-storage/execute.png)

This is quite well explained in the [online documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-access-control#levels-of-permission).

Basically, it's a permission that make sense only for folders.  It gives a group / user the permission to *traverse* a folder.

## What is "Other"?

Next is other.

![default](/assets/posts/2020/3/access-control-in-azure-data-lake-storage/other.png)

We can see the ACLs as a bunch of rules.  When a principal is trying to perform a data action (read / write / traverse), the rules are passed one by one.  The *Other* rule basically applies after all those rules.

A typical use is to give read / execute on other but write on specific group / user.

This often is a source of confusion when two Data Lake containers are configured the same way except for different "other" rule.  They then behave differently in seemingly unexplainable way.

## Summary

This was a quick tour of what we often see people stumbling across.

This was by no mean a comprehensive overview of the ADLS security feature.  The [online documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-access-control) is comprehensive and should be used for that.

Hopefully this article can be used to quickly ramp up on ADLS security model and avoid common misconceptions.