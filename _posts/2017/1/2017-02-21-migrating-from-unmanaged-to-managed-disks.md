---
title: Migrating from unmanaged to managed disks
date: 2017-02-21 08:00:02 -08:00
permalink: /2017/02/21/migrating-from-unmanaged-to-managed-disks/
categories:
- Solution
tags:
- Virtual Machines
---
We talked about <a href="http://vincentlauzon.com/2017/02/20/azure-managed-disk-overview/">Managed Disks</a>, now let's use them.

Let’s migrate existing VMs from unmanaged to managed disks.
<h3>Install pre-requisites</h3>
Update your Microsoft Azure PowerShell to the latest bits in order to include Managed Disks functionalities
<h3>Deploy ARM Template</h3>
```JavaScript

{
  "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "VM Admin User Name": {
      "defaultValue": "myadmin",
      "type": "string"
    },
    "VM Admin Password": {
      "defaultValue": null,
      "type": "securestring"
    },
    "Storage Account Name": {
      "defaultValue": "<your prefix>vmstandard",
      "type": "string"
    },
    "VM Size": {
      "defaultValue": "Standard_DS4",
      "type": "string",
      "allowedValues": [
        "Standard_DS1",
        "Standard_DS2",
        "Standard_DS3",
        "Standard_DS4",
        "Standard_DS5"
      ],
      "metadata": {
        "description": "SKU of the VM."
      }
    },
    "Public Domain Label": {
      "type": "string"
    },
    "Instance Count": {
      "defaultValue": 3,
      "type": "int"
    }
  },
  "variables": {
    "Vhds Container Name": "vhds",
    "frontIpRange": "10.0.1.0/24",
    "Public IP Name": "MyPublicIP",
    "Public LB Name": "PublicLB",
    "Front Address Pool Name": "frontPool",
    "Front NIC loop Name": "frontNicLoop",
    "Front NIC Prefix": "frontNic",
    "Front VM loop Name": "frontVMLoop",
    "Front VM Prefix": "Demo-VM",
    "Front Availability Set Name": "frontAvailSet",
    "Private LB Name": "PrivateLB",
    "VNET Name": "Demo-VNet"
  },
  "resources": [
    {
      "type": "Microsoft.Network/publicIPAddresses",
      "name": "[variables('Public IP Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public IP"
      },
      "properties": {
        "publicIPAllocationMethod": "Dynamic",
        "idleTimeoutInMinutes": 4,
        "dnsSettings": {
          "domainNameLabel": "[parameters('Public Domain Label')]"
        }
      }
    },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "name": "[variables('VNet Name')]",
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": [
            "10.0.0.0/16"
          ]
        },
        "subnets": [
          {
            "name": "front",
            "properties": {
              "addressPrefix": "[variables('frontIpRange')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
              }
            }
          }
        ]
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', 'frontNsg')]"
      ]
    },
    {
      "type": "Microsoft.Network/loadBalancers",
      "name": "[variables('Public LB Name')]",
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "tags": {
        "displayName": "Public Load Balancer"
      },
      "properties": {
        "frontendIPConfigurations": [
          {
            "name": "LoadBalancerFrontEnd",
            "comments": "Front end of LB:  the IP address",
            "properties": {
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses/', variables('Public IP Name'))]"
              }
            }
          }
        ],
        "backendAddressPools": [
          {
            "name": "[variables('Front Address Pool Name')]"
          }
        ],
        "loadBalancingRules": [
          {
            "name": "Http",
            "properties": {
              "frontendIPConfiguration": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/frontendIPConfigurations/LoadBalancerFrontEnd')]"
              },
              "frontendPort": 80,
              "backendPort": 80,
              "enableFloatingIP": false,
              "idleTimeoutInMinutes": 4,
              "protocol": "Tcp",
              "loadDistribution": "Default",
              "backendAddressPool": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
              },
              "probe": {
                "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/probes/TCP-Probe')]"
              }
            }
          }
        ],
        "probes": [
          {
            "name": "TCP-Probe",
            "properties": {
              "protocol": "Tcp",
              "port": 80,
              "intervalInSeconds": 5,
              "numberOfProbes": 2
            }
          }
        ],
        "inboundNatRules": [],
        "outboundNatRules": [],
        "inboundNatPools": []
      },
      "dependsOn": [
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('Public IP Name'))]"
      ]
    },
    {
      "apiVersion": "2015-06-15",
      "name": "frontNsg",
      "type": "Microsoft.Network/networkSecurityGroups",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {
        "securityRules": [
          {
            "name": "Allow-HTTP-From-Internet",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "80",
              "sourceAddressPrefix": "Internet",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 100,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-RDP-From-Everywhere",
            "properties": {
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "3389",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 150,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-Health-Monitoring",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "AzureLoadBalancer",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 200,
              "direction": "Inbound"
            }
          },
          {
            "name": "Disallow-everything-else-Inbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 300,
              "direction": "Inbound"
            }
          },
          {
            "name": "Allow-to-VNet",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "VirtualNetwork",
              "access": "Allow",
              "priority": 100,
              "direction": "Outbound"
            }
          },
          {
            "name": "Disallow-everything-else-Outbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "*",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*",
              "access": "Deny",
              "priority": 200,
              "direction": "Outbound"
            }
          }
        ],
        "subnets": []
      }
    },
    {
      "type": "Microsoft.Network/networkInterfaces",
      "copy": {
        "name": "[variables('Front NIC loop Name')]",
        "count": "[parameters('Instance Count')]"
      },
      "name": "[concat(variables('Front NIC Prefix'), '-', copyIndex())]",
      "tags": {
        "displayName": "Front NICs"
      },
      "apiVersion": "2016-03-30",
      "location": "[resourceGroup().location]",
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "subnet": {
                "id": "[concat(resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name')), '/subnets/front')]"
              },
              "loadBalancerBackendAddressPools": [
                {
                  "id": "[concat(resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name')), '/backendAddressPools/', variables('Front Address Pool Name'))]"
                }
              ]
            }
          }
        ],
        "dnsSettings": {
          "dnsServers": []
        },
        "enableIPForwarding": false
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Network/virtualNetworks', variables('VNet Name'))]",
        "[resourceId('Microsoft.Network/loadBalancers', variables('Public LB Name'))]"
      ]
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "copy": {
        "name": "[variables('Front VM loop Name')]",
        "count": "[parameters('Instance Count')]"
      },
      "name": "[concat(variables('Front VM Prefix'), '-', copyIndex())]",
      "tags": {
        "displayName": "Front VMs"
      },
      "apiVersion": "2015-06-15",
      "location": "[resourceGroup().location]",
      "properties": {
        "availabilitySet": {
          "id": "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
        },
        "hardwareProfile": {
          "vmSize": "[parameters('VM Size')]"
        },
        "storageProfile": {
          "imageReference": {
            "publisher": "MicrosoftWindowsServer",
            "offer": "WindowsServer",
            "sku": "2012-R2-Datacenter",
            "version": "latest"
          },
          "osDisk": {
            "name": "[concat(variables('Front VM Prefix'), '-', copyIndex())]",
            "createOption": "FromImage",
            "vhd": {
              "uri": "[concat('https', '://', parameters('Storage Account Name'), '.blob.core.windows.net', concat('/', variables('Vhds Container Name'),'/', variables('Front VM Prefix'), '-', copyIndex(),'-os-disk.vhd'))]"
            },
            "caching": "ReadWrite"
          },
          "dataDisks": []
        },
        "osProfile": {
          "computerName": "[concat(variables('Front VM Prefix'), '-', copyIndex())]",
          "adminUsername": "[parameters('VM Admin User Name')]",
          "windowsConfiguration": {
            "provisionVMAgent": true,
            "enableAutomaticUpdates": true
          },
          "secrets": [],
          "adminPassword": "[parameters('VM Admin Password')]"
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', concat(variables('Front NIC Prefix'), '-', copyIndex()))]"
            }
          ]
        }
      },
      "resources": [],
      "dependsOn": [
        "[resourceId('Microsoft.Storage/storageAccounts', parameters('Storage Account Name'))]",
        "[variables('Front NIC loop Name')]",
        "[resourceId('Microsoft.Compute/availabilitySets', variables('Front Availability Set Name'))]"
      ]
    },
    {
      "type": "Microsoft.Storage/storageAccounts",
      "sku": {
        "name": "Standard_LRS",
        "tier": "Standard"
      },
      "kind": "Storage",
      "name": "[parameters('Storage Account Name')]",
      "apiVersion": "2016-01-01",
      "location": "[resourceGroup().location]",
      "tags": {},
      "properties": {},
      "resources": [],
      "dependsOn": []
    },
    {
      "name": "[variables('Front Availability Set Name')]",
      "type": "Microsoft.Compute/availabilitySets",
      "location": "[resourceGroup().location]",
      "apiVersion": "2015-06-15",
      "tags": {
        "displayName": "FrontAvailabilitySet"
      },
      "properties": {
        "platformUpdateDomainCount": 5,
        "platformFaultDomainCount": 3
      },
      "dependsOn": []
    }
  ]
}
```
<ol>
 	<li>We used the resource group named <i>md-demo-migrate</i>.</li>
 	<li>This deploys a few VMs (by default 3) into an availability set using standard storage in a storage account</li>
 	<li>The deployment <b>takes a few minutes</b></li>
</ol>
<h3>Look at deployment</h3>
<ol>
 	<li>Select one of the VMs (e.g. <i>Demo-VM-0</i>)</li>
 	<li>Select the disk tab
<a href="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image002.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image002" src="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image002_thumb.jpg" /></a></li>
 	<li>Notice there is one disk (the OS disk) ; also notice the size isn’t specified
<a href="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image004.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image004" src="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image004_thumb.jpg" alt="clip_image004" border="0" /></a></li>
 	<li>Select the disk
<a href="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image006.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image006" src="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image006_thumb.jpg" alt="clip_image006" border="0" /></a></li>
 	<li>Notice the VHD URI and also, a few details (e.g. IOPs limit) aren’t specified</li>
 	<li>Go back to the resource group and select the availability set, i.e. <i>frontAvailSet</i></li>
 	<li>Notice under <i>Managed</i> is <i>No</i>
<a href="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image008.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image008" src="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image008_thumb.jpg" alt="clip_image008" border="0" /></a></li>
 	<li>Notice the 3 VMs are under the availability set</li>
</ol>
<h3>Login into ISE</h3>
<ol>
 	<li>Open up PowerShell ISE</li>
 	<li>Type Add-AzureRmAccount</li>
 	<li>Enter your credentials ; those credentials should be the same you are using to log into the Azure Portal</li>
 	<li>If you have more than one subscriptions</li>
</ol>
<ol>
 	<li>Type Get-AzureRmSubscription</li>
 	<li>This should list all subscriptions you have access (even partial) to</li>
 	<li>Select the <i>SubscriptionId</i> (a GUID) of the subscription you want to use</li>
 	<li>Type Select-AzureRmSubscription -SubscriptionId &lt;SubscriptionId&gt;
<i>&lt;SubscriptionId&gt;</i> is the value you just selected</li>
 	<li>This will select the specified subscription as the “current one”, i.e. future queries will be done against that subscription</li>
</ol>
<h3>Migrate to Disks</h3>
<ol>
 	<li>In PowerShell ISE, type
$rgName = 'md-demo-migrate' # or the Resource Group name you used
$avSetName = 'frontAvailSet'
$avSet = Get-AzureRmAvailabilitySet -ResourceGroupName $rgName -Name $avSetName
Update-AzureRmAvailabilitySet -AvailabilitySet $avSet -Managed</li>
 	<li>This converts the availability set into a <i>managed</i> availability set</li>
 	<li>In PowerShell ISE, type
foreach($vmInfo in $avSet.VirtualMachinesReferences)
{
$vm = Get-AzureRmVM -ResourceGroupName $rgName | where {$_.Id -eq $vmInfo.id}
Stop-AzureRmVM -ResourceGroupName $rgName -Name $vm.Name -Force
ConvertTo-AzureRmVMManagedDisk -ResourceGroupName $rgName -VMName $vm.Name
}</li>
 	<li>This shuts down each VM before converting each disk to a managed disk</li>
 	<li>This operation takes a while to execute</li>
 	<li>In the portal, go back to the availability set</li>
 	<li>Notice it is now managed
<a href="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image010.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image010" src="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image010_thumb.jpg" alt="clip_image010" border="0" /></a></li>
 	<li>A managed availability set has the following characteristics:</li>
</ol>
<ol>
 	<li>It doesn’t let us add a <i>new</i> VM with unmanaged disk</li>
 	<li>It aligns the failure domain of the availability set with the disks</li>
</ol>
<h3>Look at managed disk</h3>
<ol>
 	<li>Once at least one VM has been converted, notice it restarts</li>
 	<li>In the portal, go back to the resource group</li>
 	<li>Notice the disk resources
<a href="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image012.jpg"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="clip_image012" src="/assets/posts/2017/1/migrating-from-unmanaged-to-managed-disks/clip_image012_thumb.jpg" alt="clip_image012" border="0" /></a></li>
 	<li>Select one of the disk</li>
 	<li>Notice the size of the disk is specified, i.e. 128GB</li>
 	<li>This is one of the predefined standard disk size, in this case S10</li>
 	<li>Notice the source blob is still there ; this is because copy-on-read is used to copy the disk while the VM is running</li>
 	<li>Notice the <i>account type</i> can be changed</li>
 	<li>We can delete the storage account</li>
</ol>
<h3>Migrate to Premium Disks</h3>
<ol>
 	<li>In PowerShell, type
$disks = Get-AzureRmDisk -ResourceGroupName $rgName
foreach($disk in $disks)
{
$vm = Get-AzureRmResource -ResourceId $disk.OwnerId
Stop-AzureRmVM -Id $disk.OwnerId -Name $vm.Name -Force
$diskUpdateConfig = New-AzureRmDiskUpdateConfig –AccountType PremiumLRS
Update-AzureRmDisk -DiskUpdate $diskUpdateConfig -ResourceGroupName $rgName -DiskName $disk.Name
}</li>
 	<li>Again, this script will take a while to execute since it does stop VMs</li>
 	<li>The script will go one by one and migrate the disks to premium storage</li>
 	<li>This is possible because the VM size was DS series that support premium storage</li>
</ol>
<h3>Notes</h3>
Once we’ve tested the procedure in non-production environment, this migration procedure can be applied to production. The shutdown / convert should then be done one update domain (or one VM) at the time to avoid any downtime.
<h3>Exercise</h3>
Try to migrate the account type back to standard storage.
<h3>Clean up</h3>
We won’t be using the resource groups we have created so we can delete them.

In ISE, type Remove-AzureRmResourceGroup -Name md-demo-migrate -Force