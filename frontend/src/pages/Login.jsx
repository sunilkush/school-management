import React, { useState } from "react";
import {useDispatch,useSelector} from "react-redux";
// @components
import {
  Card,
  Input,
  Button,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
// @icons

import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../store/authSlice";

function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate()
    const auth = useSelector((state) => state.auth);
    const {loading, error} = useSelector((state)=>state.auth);
    
    const [formData, setFormData] = useState({
      email: "",
      password: "",
    });

    const handleChange =(e)=>{
        setFormData({...formData,[e.target.name]:e.target.value});
    }

    const handleSubmit = async(e)=>{
      e.preventDefault();
      const result = await dispatch(loginUser(formData));
      if(result.meta.requestStatus === "fulfilled"){
        navigate("/dashboard")
      }
    }

    return (
      <section className="px-8 bg-blue-gray-800">
        <div className="container mx-auto h-screen grid place-items-center ">
          <Card shadow={false} className="md:px-24 md:py-14 py-8 border border-gray-300">
            <CardHeader shadow={false} floated={false} className="text-center">
              <Typography variant="h1" color="blue-gray" className="mb-4 !text-3xl lg:text-4xl">
                Smart School
              </Typography>
              <Typography className="!text-gray-600 text-[18px] font-normal md:max-w-sm">
                Enjoy quick and secure access to your accounts on various Smart School platforms.
              </Typography>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:mt-12">
                <div>
                  <label htmlFor="email">
                    <Typography variant="small" color="blue-gray" className="block font-medium mb-2">
                      Your Email
                    </Typography>
                  </label>
                  <Input
                    id="email"
                    color="gray"
                    size="lg"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@mail.com"
                    className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password">
                    <Typography variant="small" color="blue-gray" className="block font-medium mb-2">
                      Your Password
                    </Typography>
                  </label>
                  <Input
                    id="password"
                    color="gray"
                    size="lg"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="*********"
                    className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" size="lg" color="gray" fullWidth disabled={loading}>
                  {loading ? "Logging in..." : "Continue"}
                </Button>
               
                <Typography variant="small" className="text-center mx-auto max-w-[19rem] !font-medium !text-gray-600">
                  Upon signing in, you consent to abide by our{" "}
                  <Link to="/terms" className="text-gray-900">
                    Terms of Service
                  </Link>{" "}
                  &{" "}
                  <Link to="/privacy" className="text-gray-900">
                    Privacy Policy.
                  </Link>
                </Typography>
              </form>
            </CardBody>
          </Card>
        </div>
      </section>
    );
  }

export default LoginPage;