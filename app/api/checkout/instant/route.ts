import { getCartItems } from "@/app/lib/cartHelper";
import ProductModel from "@/app/models/productModel";
import { auth } from "@/auth";
import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export const POST = async (req: Request) => {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json(
        {
          error: "Unauthorized request!",
        },
        { status: 401 }
      );

    const data = await req.json();
    const productId = data.productId as string;

    if (!isValidObjectId(productId))
      return NextResponse.json(
        {
          error: "Invalid product id!",
        },
        { status: 401 }
      );

    // fetching product details
    const product = await ProductModel.findById(productId);
    if (!product)
      return NextResponse.json(
        {
          error: "Product not found!",
        },
        { status: 404 }
      );

    // Ensure the product price is in the smallest currency unit (for JPY, no decimals)
    const line_items = [{
      price_data: {
        currency: "JPY",
        unit_amount: product.price.discounted, // Make sure it's in smallest unit (no decimals for JPY)
        product_data: {
          name: product.title,
          images: [product.thumbnail.url],
        },
      },
      quantity: 1,
    }];

    const customer = await stripe.customers.create({
      metadata: {
        userId: session.user.id,
        type: "instant-checkout",
        product: JSON.stringify({
          id: productId,
          title: product.title,
          price: product.price.discounted,
          totalPrice: product.price.discounted,
          thumbnail: product.thumbnail.url,
          qty: 1,
        }),
      },
    });

    // We need to generate a payment link and send to our frontend app
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: line_items,
      success_url: process.env.PAYMENT_SUCCESS_URL!, // Ensure this is defined in .env
      cancel_url: process.env.PAYMENT_CANCEL_URL!, // Ensure this is defined in .env
      shipping_address_collection: { allowed_countries: ["JP"] },
      customer: customer.id,
    };

    const checkoutSession = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Something went wrong, could not checkout!" },
      { status: 500 }
    );
  }
};
