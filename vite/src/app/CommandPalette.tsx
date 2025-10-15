import "react-cmdk/dist/cmdk.css";
import { AppEnv } from "@autumn/shared";
import {
	BarChart3,
	Code2,
	HelpCircle,
	Home,
	Layers,
	List,
	LogOut,
	Package,
	Plus,
	RefreshCw,
	Settings,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CommandPalette, { filterItems, getItemIndex } from "react-cmdk";
import { useHotkeys } from "react-hotkeys-hook";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useProductsQuery } from "@/hooks/queries/useProductsQuery";
import { useEnv } from "@/utils/envUtils";
import { navigateTo } from "@/utils/genUtils";
import { useCusSearchQuery } from "@/views/customers/hooks/useCusSearchQuery";

// Icon mapping object
const iconMap: Record<string, React.ComponentType> = {
	HomeIcon: Home,
	CogIcon: Settings,
	RectangleStackIcon: Layers,
	CodeBracketIcon: Code2,
	LifebuoyIcon: HelpCircle,
	ArrowRightOnRectangleIcon: LogOut,
	UsersIcon: Users,
	PackageIcon: Package,
	ChartBarIcon: BarChart3,
	PlusIcon: Plus,
	ListBulletIcon: List,
	ArrowPathIcon: RefreshCw,
};

const CommandPaletteComponent = () => {
	const [page, setPage] = useState<
		"root" | "projects" | "customers" | "products"
	>("root");
	const [open, setOpen] = useState<boolean>(false);
	const [search, setSearch] = useState("");
	const [customerSearch, setCustomerSearch] = useState("");
	const [productSearch, setProductSearch] = useState("");

	const navigate = useNavigate();
	const location = useLocation();
	const env = useEnv();

	// Query hooks
	const { customers, isLoading: customersLoading } = useCusSearchQuery();
	const { products, isLoading: productsLoading } = useProductsQuery();

	useHotkeys("meta+k", () => {
		setOpen(true);
	});

	// Reset page when closing
	useEffect(() => {
		if (!open) {
			setPage("root");
			setSearch("");
			setCustomerSearch("");
			setProductSearch("");
		}
	}, [open]);

	// Filter items for main page
	const rootItems = useMemo(
		() => [
			{
				heading: "Navigation",
				id: "navigation",
				items: [
					{
						id: "go-analytics",
						children: "Go to Analytics",
						icon: "ChartBarIcon",
						onClick: () => {
							navigateTo("/analytics", navigate, env);
							setOpen(false);
						},
					},
					{
						id: "go-products",
						children: "Go to Products",
						icon: "PackageIcon",
						onClick: () => {
							navigateTo("/products", navigate, env);
							setOpen(false);
						},
					},
					{
						id: "go-customers",
						children: "Go to Customers",
						icon: "UsersIcon",
						onClick: () => {
							navigateTo("/customers", navigate, env);
							setOpen(false);
						},
					},
				],
			},
			{
				heading: "Customers",
				id: "customers",
				items: [
					{
						id: "list-customers",
						children: "List Customers",
						icon: "ListBulletIcon",
						closeOnSelect: false,
						onClick: () => {
							setPage("customers");
						},
					},
					{
						id: "customer-analytics",
						children: "Customer Analytics",
						icon: "ChartBarIcon",
						onClick: () => {
							const pathMatch = location.pathname.match(/\/customers\/([^/]+)/);
							if (pathMatch) {
								navigateTo(
									`/customers/${pathMatch[1]}/analytics`,
									navigate,
									env,
								);
							} else {
								toast.error("Please navigate to a customer first");
							}
							setOpen(false);
						},
					},
				],
			},
			{
				heading: "Products",
				id: "products",
				items: [
					{
						id: "list-products",
						children: "List Products",
						icon: "ListBulletIcon",
						closeOnSelect: false,
						onClick: () => {
							setPage("products");
						},
					},
					{
						id: "create-product",
						children: "Create Product",
						icon: "PlusIcon",
						onClick: () => {
							navigateTo("/products", navigate, env);
							setOpen(false);
							// The products page will handle showing the create dialog
							setTimeout(() => {
								toast.info(
									"Navigate to Products page and click 'Add Product' button",
								);
							}, 500);
						},
					},
				],
			},
			{
				heading: "Settings",
				id: "settings",
				items: [
					{
						id: "switch-env",
						children: `Switch to ${
							env === AppEnv.Live ? "Sandbox" : "Live"
						} Environment`,
						icon: "ArrowPathIcon",
						onClick: () => {
							const newEnv = env === AppEnv.Live ? AppEnv.Sandbox : AppEnv.Live;
							const currentPath = location.pathname.replace("/sandbox", "");
							if (newEnv === AppEnv.Sandbox) {
								navigate(`/sandbox${currentPath}`);
							} else {
								navigate(currentPath);
							}
							setOpen(false);
							toast.success(`Switched to ${newEnv} environment`);
						},
					},
				],
			},
		],
		[env, location.pathname, navigate],
	);

	const filteredItems = filterItems(rootItems, search);

	// Filter customers for customer page
	const filteredCustomers = useMemo(() => {
		if (!customers) return [];
		return customers.filter((customer) =>
			customer.name?.toLowerCase().includes(customerSearch.toLowerCase()),
		);
	}, [customers, customerSearch]);

	// Filter products for product page
	const filteredProducts = useMemo(() => {
		if (!products) return [];
		return products.filter((product) =>
			product.name?.toLowerCase().includes(productSearch.toLowerCase()),
		);
	}, [products, productSearch]);

	return (
		<CommandPalette
			onChangeSearch={(value) => {
				if (page === "root") setSearch(value);
				else if (page === "customers") setCustomerSearch(value);
				else if (page === "products") setProductSearch(value);
			}}
			onChangeOpen={setOpen}
			search={
				page === "root"
					? search
					: page === "customers"
						? customerSearch
						: productSearch
			}
			isOpen={open}
			page={page}
		>
			{/* Main Page */}
			{/* biome-ignore lint/correctness/useUniqueElementIds: react-cmdk requires static page IDs */}
			<CommandPalette.Page id="root">
				{filteredItems.length ? (
					filteredItems.map((list) => (
						<CommandPalette.List key={list.id} heading={list.heading}>
							{list.items.map(({ id, icon, ...rest }) => (
								<CommandPalette.ListItem
									key={id}
									index={getItemIndex(filteredItems, id)}
									icon={iconMap[icon]}
									{...rest}
								/>
							))}
						</CommandPalette.List>
					))
				) : (
					<CommandPalette.FreeSearchAction />
				)}
			</CommandPalette.Page>

			{/* Customers List Page */}
			{/* biome-ignore lint/correctness/useUniqueElementIds: react-cmdk requires static page IDs */}
			<CommandPalette.Page
				id="customers"
				onEscape={() => {
					setPage("root");
					setCustomerSearch("");
				}}
			>
				<CommandPalette.List heading="Customers">
					{customersLoading ? (
						<CommandPalette.ListItem index={0} icon={RefreshCw}>
							Loading customers...
						</CommandPalette.ListItem>
					) : filteredCustomers.length > 0 ? (
						filteredCustomers.slice(0, 10).map((customer, index) => (
							<CommandPalette.ListItem
								key={customer.internal_id}
								index={index}
								icon={Users}
								onClick={() => {
									navigateTo(
										`/customers/${customer.internal_id}`,
										navigate,
										env,
									);
									setOpen(false);
								}}
							>
								{customer.name || customer.email || customer.internal_id}
							</CommandPalette.ListItem>
						))
					) : (
						<CommandPalette.ListItem index={0} icon={Users}>
							No customers found
						</CommandPalette.ListItem>
					)}
				</CommandPalette.List>
			</CommandPalette.Page>

			{/* Products List Page */}
			{/* biome-ignore lint/correctness/useUniqueElementIds: react-cmdk requires static page IDs */}
			<CommandPalette.Page
				id="products"
				onEscape={() => {
					setPage("root");
					setProductSearch("");
				}}
			>
				<CommandPalette.List heading="Products">
					{productsLoading ? (
						<CommandPalette.ListItem index={0} icon={RefreshCw}>
							Loading products...
						</CommandPalette.ListItem>
					) : filteredProducts.length > 0 ? (
						filteredProducts.slice(0, 10).map((product, index) => (
							<CommandPalette.ListItem
								key={product.id}
								index={index}
								icon={Package}
								onClick={() => {
									navigateTo(`/products/${product.id}`, navigate, env);
									setOpen(false);
								}}
							>
								{product.name}
								{product.is_add_on && " (Add-on)"}
							</CommandPalette.ListItem>
						))
					) : (
						<CommandPalette.ListItem index={0} icon={Package}>
							No products found
						</CommandPalette.ListItem>
					)}
				</CommandPalette.List>
			</CommandPalette.Page>
		</CommandPalette>
	);
};

export default CommandPaletteComponent;
